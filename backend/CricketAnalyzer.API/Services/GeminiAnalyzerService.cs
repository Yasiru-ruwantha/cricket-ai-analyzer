using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using CricketAnalyzer.API.Data;
using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;

namespace CricketAnalyzer.API.Services;

public class GeminiAnalyzerService : IAIAnalyzerService
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAnalyzerService> _logger;

    public GeminiAnalyzerService(
        HttpClient httpClient,
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        ILogger<GeminiAnalyzerService> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AIAnalysis> GeneratePlayerAnalysisAsync(int playerId, GenerateAnalysisRequestDto? request = null)
    {
        var player = await _dbContext.Players
            .Include(p => p.Statistics)
            .FirstOrDefaultAsync(p => p.Id == playerId);

        if (player == null)
        {
            throw new KeyNotFoundException($"Player with ID {playerId} was not found.");
        }

        var apiKey = GetGeminiApiKey();
        var model = _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        AIAnalysis analysis;

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Gemini API key is not configured. Using rule-based intelligent cricket analyzer engine.");
            analysis = GenerateRuleBasedAnalysis(player, request);
        }
        else
        {
            try
            {
                analysis = await CallGeminiForPlayerAnalysisAsync(player, request, apiKey, model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gemini API call failed for player {Name}. Falling back to internal analysis engine.", player.Name);
                analysis = GenerateRuleBasedAnalysis(player, request);
            }
        }

        // Persist analysis in database
        _dbContext.AIAnalyses.Add(analysis);
        await _dbContext.SaveChangesAsync();

        return analysis;
    }

    public async Task<PlayerComparisonResponseDto> ComparePlayersAsync(ComparePlayersRequestDto request)
    {
        var player1 = await _dbContext.Players
            .Include(p => p.Statistics)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Player1Id);

        var player2 = await _dbContext.Players
            .Include(p => p.Statistics)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Player2Id);

        if (player1 == null) throw new KeyNotFoundException($"Player 1 with ID {request.Player1Id} not found.");
        if (player2 == null) throw new KeyNotFoundException($"Player 2 with ID {request.Player2Id} not found.");

        var apiKey = GetGeminiApiKey();
        var model = _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            return GenerateRuleBasedComparison(player1, player2, request);
        }

        try
        {
            return await CallGeminiForComparisonAsync(player1, player2, request, apiKey, model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini comparison failed between {P1} and {P2}. Falling back to rule-based engine.", player1.Name, player2.Name);
            return GenerateRuleBasedComparison(player1, player2, request);
        }
    }

    private string? GetGeminiApiKey()
    {
        var key = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(key) || key.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            key = Environment.GetEnvironmentVariable("GEMINI_API_KEY") 
               ?? Environment.GetEnvironmentVariable("GOOGLE_API_KEY");
        }
        return key;
    }

    private async Task<AIAnalysis> CallGeminiForPlayerAnalysisAsync(
        Player player, 
        GenerateAnalysisRequestDto? request, 
        string apiKey, 
        string model)
    {
        var stats = player.Statistics;
        var statsSummary = stats != null
            ? $"Matches: {stats.MatchesPlayed}, Runs: {stats.TotalRuns}, Batting Avg: {stats.BattingAverage}, Strike Rate: {stats.StrikeRate}, Highest Score: {stats.HighestScore}, 100s: {stats.Centuries}, 50s: {stats.Fifties}, Wickets: {stats.TotalWickets}, Bowling Avg: {stats.BowlingAverage}, Economy: {stats.BowlingEconomy}, Best Figures: {stats.BestBowlingFigures ?? "N/A"}"
            : "No detailed match statistics imported yet.";

        var prompt = $@"
You are an Elite International Cricket Performance Analyst and Scouting Director.
Analyze the following cricketer and generate an actionable, highly detailed tactical scouting report.

[CRICKETER PROFILE]
Name: {player.Name}
Country: {player.Country}
Primary Role: {player.Role}
Batting Style: {player.BattingStyle ?? "Not Specified"}
Bowling Style: {player.BowlingStyle ?? "Not Specified"}
Career Statistics: {statsSummary}

[CUSTOM SCOUTING CONTEXT]
Tactical Focus: {request?.CustomFocus ?? "Comprehensive scouting breakdown"}
Opponent Context: {request?.OpponentTeam ?? "General international competition"}
Target Format: {request?.Format ?? "All formats"}

You MUST respond strictly in valid JSON format with the following keys:
{{
  ""summary"": ""A sharp 2-3 sentence executive evaluation summarizing their core profile, threat level, and modern utility."",
  ""strengths"": ""Bulleted list (using markdown -) of 3-5 technical, physical, or tactical strengths."",
  ""weaknesses"": ""Bulleted list (using markdown -) of 2-4 tactical vulnerabilities, dismissal patterns, or exploit areas for opposition."",
  ""recentFormTrend"": ""In-depth analysis of their scoring tempo, phase efficiency (powerplay, middle, death), consistency, and current form."",
  ""recommendations"": ""Bulleted list (using markdown -) of 3-4 tactical instructions for team coaches and opposition captains."",
  ""fullReportMarkdown"": ""A comprehensive markdown-formatted scouting dossier including sections: Executive Brief, Batting Breakdown, Bowling/Fielding Breakdown, Phase-by-Phase Plan, Dismissal Exploits, and Matchday Action Plan.""
}}
";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                temperature = 0.4,
                topP = 0.95,
                responseMimeType = "application/json"
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var parsed = ParseGeminiPlayerJson(jsonResponse);

        return new AIAnalysis
        {
            PlayerId = player.Id,
            UserId = request?.UserId,
            Summary = parsed.Summary,
            Strengths = parsed.Strengths,
            Weaknesses = parsed.Weaknesses,
            RecentFormTrend = parsed.RecentFormTrend,
            Recommendations = parsed.Recommendations,
            FullReportMarkdown = parsed.FullReportMarkdown,
            ModelUsed = $"Gemini ({model})",
            CreatedAt = DateTime.UtcNow
        };
    }

    private async Task<PlayerComparisonResponseDto> CallGeminiForComparisonAsync(
        Player p1, 
        Player p2, 
        ComparePlayersRequestDto request, 
        string apiKey, 
        string model)
    {
        var p1Stats = p1.Statistics != null
            ? $"Runs: {p1.Statistics.TotalRuns}, Bat Avg: {p1.Statistics.BattingAverage}, SR: {p1.Statistics.StrikeRate}, Wickets: {p1.Statistics.TotalWickets}, Econ: {p1.Statistics.BowlingEconomy}"
            : "No stats";

        var p2Stats = p2.Statistics != null
            ? $"Runs: {p2.Statistics.TotalRuns}, Bat Avg: {p2.Statistics.BattingAverage}, SR: {p2.Statistics.StrikeRate}, Wickets: {p2.Statistics.TotalWickets}, Econ: {p2.Statistics.BowlingEconomy}"
            : "No stats";

        var prompt = $@"
You are an Elite Cricket Director. Compare two players head-to-head for an upcoming match.
Format: {request.MatchFormat ?? "Overall"}
Pitch/Conditions: {request.PitchCondition ?? "Standard International Pitch"}

Player 1: {p1.Name} ({p1.Country}, {p1.Role})
Batting: {p1.BattingStyle}, Bowling: {p1.BowlingStyle}
Stats: {p1Stats}

Player 2: {p2.Name} ({p2.Country}, {p2.Role})
Batting: {p2.BattingStyle}, Bowling: {p2.BowlingStyle}
Stats: {p2Stats}

Respond in strictly valid JSON:
{{
  ""comparisonSummary"": ""2-3 sentence overview of the matchup"",
  ""battingComparison"": ""Detailed comparison of batting mechanics, strike rotation, and boundary capability"",
  ""bowlingComparison"": ""Comparison of bowling depth or control"",
  ""tacticalVerdict"": ""Head-to-head tactical verdict in {request.PitchCondition} conditions"",
  ""recommendedPick"": ""Name of the recommended player with concise justification""
}}
";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                temperature = 0.4,
                responseMimeType = "application/json"
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var parsed = ParseGeminiComparisonJson(jsonResponse);

        return new PlayerComparisonResponseDto
        {
            Player1 = MapToResponseDto(p1),
            Player2 = MapToResponseDto(p2),
            MatchFormat = request.MatchFormat ?? "Overall",
            ComparisonSummary = parsed.ComparisonSummary,
            BattingComparison = parsed.BattingComparison,
            BowlingComparison = parsed.BowlingComparison,
            TacticalVerdict = parsed.TacticalVerdict,
            RecommendedPick = parsed.RecommendedPick,
            ModelUsed = $"Gemini ({model})",
            AnalyzedAt = DateTime.UtcNow
        };
    }

    private ParsedPlayerAnalysis ParseGeminiPlayerJson(string geminiResponseJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(geminiResponseJson);
            var root = doc.RootElement;
            var text = root
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(text))
            {
                throw new InvalidOperationException("Gemini returned empty text.");
            }

            var cleanJson = CleanJsonMarkdownFences(text);
            var parsed = JsonSerializer.Deserialize<ParsedPlayerAnalysis>(cleanJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return parsed ?? throw new InvalidOperationException("Failed to deserialize Gemini output.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Gemini JSON response.");
            throw;
        }
    }

    private ParsedComparisonAnalysis ParseGeminiComparisonJson(string geminiResponseJson)
    {
        using var doc = JsonDocument.Parse(geminiResponseJson);
        var root = doc.RootElement;
        var text = root
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        var cleanJson = CleanJsonMarkdownFences(text ?? "{}");
        var parsed = JsonSerializer.Deserialize<ParsedComparisonAnalysis>(cleanJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return parsed ?? new ParsedComparisonAnalysis();
    }

    private static string CleanJsonMarkdownFences(string input)
    {
        var trimmed = input.Trim();
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed.Substring(7);
        }
        else if (trimmed.StartsWith("```"))
        {
            trimmed = trimmed.Substring(3);
        }

        if (trimmed.EndsWith("```"))
        {
            trimmed = trimmed.Substring(0, trimmed.Length - 3);
        }

        return trimmed.Trim();
    }

    private AIAnalysis GenerateRuleBasedAnalysis(Player player, GenerateAnalysisRequestDto? request)
    {
        var stats = player.Statistics;
        var sbStrengths = new StringBuilder();
        var sbWeaknesses = new StringBuilder();
        var sbRecommendations = new StringBuilder();

        var role = player.Role?.ToLowerInvariant() ?? "cricketer";
        var isBatsman = role.Contains("bat") || role.Contains("all-rounder") || role.Contains("wicket");
        var isBowler = role.Contains("bowl") || role.Contains("all-rounder");

        if (stats != null)
        {
            if (isBatsman)
            {
                if (stats.BattingAverage >= 45)
                {
                    sbStrengths.AppendLine("- **World-Class Consistency:** Boasts an elite career batting average (" + stats.BattingAverage + "), indicating immense anchor stability and match-winning stamina.");
                }
                else if (stats.BattingAverage >= 35)
                {
                    sbStrengths.AppendLine("- **Dependable Top/Middle Order Presence:** Solid batting average (" + stats.BattingAverage + ") with reliable run accumulation capability.");
                }
                else
                {
                    sbWeaknesses.AppendLine("- **Average Conversion Vulnerability:** Career average of " + stats.BattingAverage + " indicates vulnerability to soft dismissals before reaching big scores.");
                }

                if (stats.StrikeRate >= 130)
                {
                    sbStrengths.AppendLine("- **High-Impact Scoring Tempo:** Exceptional strike rate (" + stats.StrikeRate + ") allows rapid boundary finding and swift pressure transfer onto opposition bowlers.");
                }
                else if (stats.StrikeRate < 100 && (request?.Format?.Contains("T20", StringComparison.OrdinalIgnoreCase) == true))
                {
                    sbWeaknesses.AppendLine("- **Pacing Constraint in Modern T20s:** Career strike rate (" + stats.StrikeRate + ") can lead to dot-ball pressure during high-tempo chases.");
                }

                if (stats.Centuries > 10)
                {
                    sbStrengths.AppendLine("- **Prolific Matchwinner:** Converted " + stats.Centuries + " centuries and " + stats.Fifties + " half-centuries, demonstrating elite temperament under scoreboard pressure.");
                }
            }

            if (isBowler)
            {
                if (stats.BowlingEconomy > 0 && stats.BowlingEconomy <= 7.0m)
                {
                    sbStrengths.AppendLine("- **Suffocating Economy Control:** Economy rate of " + stats.BowlingEconomy + " severely restricts boundary scoring in the middle overs.");
                }
                else if (stats.BowlingEconomy > 8.8m)
                {
                    sbWeaknesses.AppendLine("- **Concession Under Attack:** Economy of " + stats.BowlingEconomy + " exposes risk during death overs when batsmen target the V.");
                }

                if (stats.TotalWickets > 50)
                {
                    sbStrengths.AppendLine("- **Proven Breakthrough Threat:** Has taken " + stats.TotalWickets + " career wickets with notable best figures of " + (stats.BestBowlingFigures ?? "N/A") + ".");
                }
            }
        }
        else
        {
            sbStrengths.AppendLine("- High athletic potential with natural " + (player.BattingStyle ?? "batting") + " and " + (player.BowlingStyle ?? "bowling") + " discipline.");
            sbWeaknesses.AppendLine("- Detailed historical statistical sample is pending live match import.");
        }

        if (sbStrengths.Length == 0)
        {
            sbStrengths.AppendLine("- Disciplined match execution and adaptable technique across varying conditions.");
        }
        if (sbWeaknesses.Length == 0)
        {
            sbWeaknesses.AppendLine("- Can be challenged by tight fifth-stump channels early in the innings before finding groove.");
        }

        sbRecommendations.AppendLine("- **Field Setting Strategy:** Employ catching mid-wicket and deep cover sweeper early to deny boundary outlets.");
        sbRecommendations.AppendLine("- **Bowling Plan:** Bowl hard back-of-a-length deliveries targeted at the ribcage to test pull shot commitment.");
        if (request?.OpponentTeam != null)
        {
            sbRecommendations.AppendLine($"- **Tactical Plan vs {request.OpponentTeam}:** Leverage strike bowlers in 2-over burst spells to test patience.");
        }

        var focusText = !string.IsNullOrWhiteSpace(request?.CustomFocus) ? $" (Special Focus: {request.CustomFocus})" : "";
        var summary = $"{player.Name} is a high-caliber {player.Country} {player.Role} featuring {player.BattingStyle ?? "orthodox"} batting mechanics and {player.BowlingStyle ?? "standard"} bowling ability.{focusText}";
        var formTrend = stats != null && stats.MatchesPlayed > 50
            ? $"Experienced campaigner across {stats.MatchesPlayed} matches with an aggregate of {stats.TotalRuns} runs and {stats.TotalWickets} wickets, showing resilient match fitness."
            : "Developing match sample; continues to refine match readiness in competitive domestic and international circuits.";

        var battingStyle = player.BattingStyle ?? "N/A";
        var bowlingStyle = player.BowlingStyle ?? "N/A";
        var fullReport = $@"# Tactical Scouting Report: {player.Name}

**Country:** {player.Country} | **Role:** {player.Role} | **Batting:** {battingStyle} | **Bowling:** {bowlingStyle}

## 1. Executive Summary
{summary}

## 2. Core Strengths
{sbStrengths}

## 3. Vulnerabilities & Dismissal Patterns
{sbWeaknesses}

## 4. Phase-by-Phase & Form Analysis
{formTrend}

## 5. Strategic Recommendations for Opposition & Coaching Staff
{sbRecommendations}
";

        return new AIAnalysis
        {
            PlayerId = player.Id,
            UserId = request?.UserId,
            Summary = summary,
            Strengths = sbStrengths.ToString().Trim(),
            Weaknesses = sbWeaknesses.ToString().Trim(),
            RecentFormTrend = formTrend,
            Recommendations = sbRecommendations.ToString().Trim(),
            FullReportMarkdown = fullReport,
            ModelUsed = "CricketAnalyzer-Engine (Built-in Tactical Analyst)",
            CreatedAt = DateTime.UtcNow
        };
    }

    private PlayerComparisonResponseDto GenerateRuleBasedComparison(Player p1, Player p2, ComparePlayersRequestDto request)
    {
        var p1Avg = p1.Statistics?.BattingAverage ?? 0;
        var p2Avg = p2.Statistics?.BattingAverage ?? 0;
        var p1SR = p1.Statistics?.StrikeRate ?? 0;
        var p2SR = p2.Statistics?.StrikeRate ?? 0;

        string recommended = p1Avg >= p2Avg ? p1.Name : p2.Name;
        string rationale = p1Avg >= p2Avg
            ? $"{p1.Name} holds the edge with superior scoring consistency (Avg {p1Avg} vs {p2Avg})."
            : $"{p2.Name} offers greater scoring stability (Avg {p2Avg} vs {p1Avg}).";

        return new PlayerComparisonResponseDto
        {
            Player1 = MapToResponseDto(p1),
            Player2 = MapToResponseDto(p2),
            MatchFormat = request.MatchFormat ?? "Overall",
            ComparisonSummary = $"Head-to-head comparison between {p1.Name} ({p1.Country}) and {p2.Name} ({p2.Country}) for {request.PitchCondition ?? "Standard"} conditions.",
            BattingComparison = $"{p1.Name} (Avg: {p1Avg}, SR: {p1SR}) vs {p2.Name} (Avg: {p2Avg}, SR: {p2SR}). Both players offer distinct tactical advantages depending on whether anchor stability or power hitting is needed.",
            BowlingComparison = $"{p1.Name} wickets: {p1.Statistics?.TotalWickets ?? 0} vs {p2.Name} wickets: {p2.Statistics?.TotalWickets ?? 0}.",
            TacticalVerdict = $"In {request.PitchCondition ?? "standard"} conditions, team balance will favor the player who can control middle overs tempo.",
            RecommendedPick = $"{recommended} - {rationale}",
            ModelUsed = "CricketAnalyzer-Engine (Built-in Comparison)",
            AnalyzedAt = DateTime.UtcNow
        };
    }

    private static PlayerResponseDto MapToResponseDto(Player player)
    {
        return new PlayerResponseDto
        {
            Id = player.Id,
            Name = player.Name,
            Country = player.Country,
            Role = player.Role,
            BattingStyle = player.BattingStyle,
            BowlingStyle = player.BowlingStyle,
            DateOfBirth = player.DateOfBirth,
            ExternalApiId = player.ExternalApiId,
            ImageUrl = player.ImageUrl,
            CreatedAt = player.CreatedAt,
            Statistics = player.Statistics == null ? null : new PlayerStatisticsDto
            {
                Format = player.Statistics.Format,
                MatchesPlayed = player.Statistics.MatchesPlayed,
                TotalRuns = player.Statistics.TotalRuns,
                BattingAverage = player.Statistics.BattingAverage,
                StrikeRate = player.Statistics.StrikeRate,
                HighestScore = player.Statistics.HighestScore,
                Centuries = player.Statistics.Centuries,
                Fifties = player.Statistics.Fifties,
                TotalWickets = player.Statistics.TotalWickets,
                BowlingAverage = player.Statistics.BowlingAverage,
                BowlingEconomy = player.Statistics.BowlingEconomy,
                BestBowlingFigures = player.Statistics.BestBowlingFigures,
                LastCalculatedAt = player.Statistics.LastCalculatedAt
            }
        };
    }

    private class ParsedPlayerAnalysis
    {
        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("strengths")]
        public string Strengths { get; set; } = string.Empty;

        [JsonPropertyName("weaknesses")]
        public string Weaknesses { get; set; } = string.Empty;

        [JsonPropertyName("recentFormTrend")]
        public string RecentFormTrend { get; set; } = string.Empty;

        [JsonPropertyName("recommendations")]
        public string Recommendations { get; set; } = string.Empty;

        [JsonPropertyName("fullReportMarkdown")]
        public string FullReportMarkdown { get; set; } = string.Empty;
    }

    private class ParsedComparisonAnalysis
    {
        [JsonPropertyName("comparisonSummary")]
        public string ComparisonSummary { get; set; } = string.Empty;

        [JsonPropertyName("battingComparison")]
        public string BattingComparison { get; set; } = string.Empty;

        [JsonPropertyName("bowlingComparison")]
        public string BowlingComparison { get; set; } = string.Empty;

        [JsonPropertyName("tacticalVerdict")]
        public string TacticalVerdict { get; set; } = string.Empty;

        [JsonPropertyName("recommendedPick")]
        public string RecommendedPick { get; set; } = string.Empty;
    }
}
