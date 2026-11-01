using System.Globalization;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using CricketAnalyzer.API.Data;
using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;

namespace CricketAnalyzer.API.Services;

public class CricApiClient : ICricketDataProvider
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<CricApiClient> _logger;
    private readonly string _apiKey;

    public CricApiClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ApplicationDbContext dbContext,
        ILogger<CricApiClient> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _logger = logger;
        _apiKey = configuration["CricketApi:ApiKey"] 
            ?? throw new InvalidOperationException("CricketApi:ApiKey is not configured in appsettings.json.");
    }

    public async Task<IEnumerable<CricApiPlayerSearchItem>> SearchExternalPlayersAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Enumerable.Empty<CricApiPlayerSearchItem>();
        }

        try
        {
            var url = $"players?apikey={_apiKey}&offset=0&search={Uri.EscapeDataString(query.Trim())}";
            _logger.LogInformation("Calling CricAPI search for query: {Query}", query);

            var response = await _httpClient.GetFromJsonAsync<CricApiPlayerSearchResponse>(url);

            if (response?.Status == "success" && response.Data != null)
            {
                return response.Data;
            }

            _logger.LogWarning("CricAPI returned non-success or empty data: {Status}", response?.Status);
            return Enumerable.Empty<CricApiPlayerSearchItem>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while searching external cricket API for {Query}", query);
            return Enumerable.Empty<CricApiPlayerSearchItem>();
        }
    }

    public async Task<Player?> ImportPlayerByExternalIdAsync(string externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return null;
        }

        try
        {
            // 1. Check if we already have this player in the database
            var existingPlayer = await _dbContext.Players
                .Include(p => p.Statistics)
                .FirstOrDefaultAsync(p => p.ExternalApiId == externalId);

            // 2. Fetch fresh details and statistics from CricAPI
            var url = $"players_info?apikey={_apiKey}&id={Uri.EscapeDataString(externalId.Trim())}";
            _logger.LogInformation("Calling CricAPI players_info for ID: {ExternalId}", externalId);

            var response = await _httpClient.GetFromJsonAsync<CricApiPlayerInfoResponse>(url);
            if (response?.Status != "success" || response.Data == null)
            {
                _logger.LogWarning("CricAPI could not find player info for ID {ExternalId}: {Status}", externalId, response?.Status);
                return existingPlayer; // Return existing cached version if external call failed
            }

            var data = response.Data;

            // 3. Parse date of birth safely
            DateTime? parsedDob = null;
            if (DateTime.TryParse(data.DateOfBirth, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var dob))
            {
                parsedDob = DateTime.SpecifyKind(dob, DateTimeKind.Utc);
            }

            // 4. Calculate/Aggregate statistics from stats array
            var stats = data.Stats ?? new List<CricApiStatItem>();
            var parsedStats = AggregateStats(stats);

            // 5. Update existing or insert new Player
            if (existingPlayer != null)
            {
                existingPlayer.Name = data.Name.Trim();
                existingPlayer.Country = string.IsNullOrWhiteSpace(data.Country) ? existingPlayer.Country : data.Country.Trim();
                existingPlayer.Role = string.IsNullOrWhiteSpace(data.Role) ? existingPlayer.Role : data.Role.Trim();
                existingPlayer.BattingStyle = data.BattingStyle?.Trim() ?? existingPlayer.BattingStyle;
                existingPlayer.BowlingStyle = data.BowlingStyle?.Trim() ?? existingPlayer.BowlingStyle;
                existingPlayer.DateOfBirth = parsedDob ?? existingPlayer.DateOfBirth;
                existingPlayer.ImageUrl = data.PlayerImg?.Trim() ?? existingPlayer.ImageUrl;
                existingPlayer.UpdatedAt = DateTime.UtcNow;

                if (existingPlayer.Statistics != null)
                {
                    UpdatePlayerStatistics(existingPlayer.Statistics, parsedStats);
                }
                else
                {
                    parsedStats.PlayerId = existingPlayer.Id;
                    existingPlayer.Statistics = parsedStats;
                }

                await _dbContext.SaveChangesAsync();
                _logger.LogInformation("Updated cached player {Name} (ID: {Id}) from CricAPI", existingPlayer.Name, existingPlayer.Id);
                return existingPlayer;
            }
            else
            {
                var newPlayer = new Player
                {
                    ExternalApiId = externalId.Trim(),
                    Name = data.Name.Trim(),
                    Country = string.IsNullOrWhiteSpace(data.Country) ? "International" : data.Country.Trim(),
                    Role = string.IsNullOrWhiteSpace(data.Role) ? "Player" : data.Role.Trim(),
                    BattingStyle = data.BattingStyle?.Trim(),
                    BowlingStyle = data.BowlingStyle?.Trim(),
                    DateOfBirth = parsedDob,
                    ImageUrl = data.PlayerImg?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _dbContext.Players.Add(newPlayer);
                await _dbContext.SaveChangesAsync();

                parsedStats.PlayerId = newPlayer.Id;
                newPlayer.Statistics = parsedStats;
                _dbContext.PlayerStatistics.Add(parsedStats);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Successfully imported new player {Name} (ID: {Id}) from CricAPI", newPlayer.Name, newPlayer.Id);
                return newPlayer;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing player {ExternalId} from CricAPI", externalId);
            return null;
        }
    }

    private PlayerStatistics AggregateStats(List<CricApiStatItem> stats)
    {
        var result = new PlayerStatistics
        {
            Format = "Overall Career",
            LastCalculatedAt = DateTime.UtcNow
        };

        int totalRuns = 0;
        int totalMatches = 0;
        int totalHundreds = 0;
        int totalFifties = 0;
        int highestScore = 0;
        int totalWickets = 0;
        decimal totalBattingAvgSum = 0;
        int battingAvgCount = 0;
        decimal totalStrikeRateSum = 0;
        int strikeRateCount = 0;
        decimal totalEconomySum = 0;
        int economyCount = 0;
        string? bestBowling = null;

        foreach (var item in stats)
        {
            if (string.IsNullOrWhiteSpace(item.Stat) || string.IsNullOrWhiteSpace(item.Value))
                continue;

            var statKey = item.Stat.Trim().ToLowerInvariant();
            var valStr = item.Value.Trim();

            // Batting runs
            if (statKey == "runs" && item.Fn?.Trim().ToLowerInvariant() == "batting" && int.TryParse(valStr, out var runs))
            {
                totalRuns += runs;
            }
            // Matches played
            else if (statKey == "m" && int.TryParse(valStr, out var m))
            {
                totalMatches += m;
            }
            // Centuries
            else if ((statKey == "100" || statKey == "100s") && int.TryParse(valStr, out var hundreds))
            {
                totalHundreds += hundreds;
            }
            // Fifties
            else if ((statKey == "50" || statKey == "50s") && int.TryParse(valStr, out var fifties))
            {
                totalFifties += fifties;
            }
            // Highest score
            else if (statKey == "hs" && int.TryParse(valStr.Replace("*", string.Empty), out var hs))
            {
                if (hs > highestScore) highestScore = hs;
            }
            // Batting Average
            else if (statKey == "avg" && item.Fn?.Trim().ToLowerInvariant() == "batting" && decimal.TryParse(valStr, CultureInfo.InvariantCulture, out var avg) && avg > 0)
            {
                totalBattingAvgSum += avg;
                battingAvgCount++;
            }
            // Strike Rate
            else if (statKey == "sr" && item.Fn?.Trim().ToLowerInvariant() == "batting" && decimal.TryParse(valStr, CultureInfo.InvariantCulture, out var sr) && sr > 0)
            {
                totalStrikeRateSum += sr;
                strikeRateCount++;
            }
            // Bowling Wickets
            else if ((statKey == "wkts" || statKey == "wickets") && int.TryParse(valStr, out var wkts))
            {
                totalWickets += wkts;
            }
            // Bowling Economy
            else if ((statKey == "econ" || statKey == "economy") && decimal.TryParse(valStr, CultureInfo.InvariantCulture, out var econ) && econ > 0)
            {
                totalEconomySum += econ;
                economyCount++;
            }
            // Best Bowling Inning
            else if (statKey == "bbi" && valStr != "0/0" && !string.IsNullOrWhiteSpace(valStr))
            {
                bestBowling ??= valStr;
            }
        }

        result.MatchesPlayed = totalMatches > 0 ? totalMatches : 1;
        result.TotalRuns = totalRuns;
        result.HighestScore = highestScore;
        result.Centuries = totalHundreds;
        result.Fifties = totalFifties;
        result.TotalWickets = totalWickets;
        result.BattingAverage = battingAvgCount > 0 ? Math.Round(totalBattingAvgSum / battingAvgCount, 2) : 0;
        result.StrikeRate = strikeRateCount > 0 ? Math.Round(totalStrikeRateSum / strikeRateCount, 2) : 0;
        result.BowlingEconomy = economyCount > 0 ? Math.Round(totalEconomySum / economyCount, 2) : 0;
        result.BowlingAverage = totalWickets > 0 && totalRuns > 0 ? Math.Round((decimal)totalRuns / totalWickets, 2) : 0;
        result.BestBowlingFigures = bestBowling;

        return result;
    }

    private void UpdatePlayerStatistics(PlayerStatistics target, PlayerStatistics source)
    {
        target.Format = source.Format;
        target.MatchesPlayed = source.MatchesPlayed;
        target.TotalRuns = source.TotalRuns;
        target.BattingAverage = source.BattingAverage;
        target.StrikeRate = source.StrikeRate;
        target.HighestScore = source.HighestScore;
        target.Centuries = source.Centuries;
        target.Fifties = source.Fifties;
        target.TotalWickets = source.TotalWickets;
        target.BowlingAverage = source.BowlingAverage;
        target.BowlingEconomy = source.BowlingEconomy;
        target.BestBowlingFigures = source.BestBowlingFigures;
        target.LastCalculatedAt = DateTime.UtcNow;
    }
}
