using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CricketAnalyzer.API.Data;
using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;
using CricketAnalyzer.API.Services;

namespace CricketAnalyzer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICricketDataProvider _cricketProvider;
    private readonly ILogger<PlayersController> _logger;

    public PlayersController(
        ApplicationDbContext context, 
        ICricketDataProvider cricketProvider,
        ILogger<PlayersController> logger)
    {
        _context = context;
        _cricketProvider = cricketProvider;
        _logger = logger;
    }

    /// <summary>
    /// Get all local players with optional search filter by name or country.
    /// Example: GET /api/players?search=Kohli
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlayerResponseDto>>> GetPlayers([FromQuery] string? search)
    {
        var query = _context.Players
            .Include(p => p.Statistics)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim().ToLower();
            query = query.Where(p => 
                p.Name.ToLower().Contains(trimmedSearch) || 
                p.Country.ToLower().Contains(trimmedSearch));
        }

        var players = await query
            .OrderBy(p => p.Name)
            .Select(p => MapToResponseDto(p))
            .ToListAsync();

        return Ok(players);
    }

    /// <summary>
    /// Get a single player by local database ID.
    /// Example: GET /api/players/1
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlayerResponseDto>> GetPlayerById(int id)
    {
        var player = await _context.Players
            .Include(p => p.Statistics)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (player == null)
        {
            return NotFound(new { message = $"Player with ID {id} not found." });
        }

        return Ok(MapToResponseDto(player));
    }

    /// <summary>
    /// Search the external CricAPI directly for players by name.
    /// Example: GET /api/players/external-search?query=Kohli
    /// </summary>
    [HttpGet("external-search")]
    public async Task<ActionResult<IEnumerable<CricApiPlayerSearchItem>>> SearchExternalPlayers([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query cannot be empty." });
        }

        var results = await _cricketProvider.SearchExternalPlayersAsync(query);
        return Ok(results);
    }

    /// <summary>
    /// Imports a player and their statistics from CricAPI into the local database by their CricAPI ID.
    /// If the player is already cached, it updates their profile and stats.
    /// Example: POST /api/players/import/c61d247d-7f77-452c-b495-2813a9cd0ac4
    /// </summary>
    [HttpPost("import/{externalId}")]
    public async Task<ActionResult<PlayerResponseDto>> ImportPlayer(string externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return BadRequest(new { message = "External player ID cannot be empty." });
        }

        var player = await _cricketProvider.ImportPlayerByExternalIdAsync(externalId);
        if (player == null)
        {
            return NotFound(new { message = $"Could not import or find player with external ID '{externalId}'." });
        }

        return Ok(MapToResponseDto(player));
    }

    /// <summary>
    /// Create a new player manually.
    /// Example: POST /api/players
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PlayerResponseDto>> CreatePlayer([FromBody] CreatePlayerDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var player = new Player
        {
            Name = dto.Name.Trim(),
            Country = dto.Country.Trim(),
            Role = dto.Role.Trim(),
            BattingStyle = dto.BattingStyle?.Trim(),
            BowlingStyle = dto.BowlingStyle?.Trim(),
            DateOfBirth = dto.DateOfBirth.HasValue ? DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc) : null,
            ImageUrl = dto.ImageUrl?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new player: {Name} (ID: {Id})", player.Name, player.Id);

        return CreatedAtAction(nameof(GetPlayerById), new { id = player.Id }, MapToResponseDto(player));
    }

    /// <summary>
    /// Update an existing player.
    /// Example: PUT /api/players/1
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePlayer(int id, [FromBody] UpdatePlayerDto dto)
    {
        var player = await _context.Players.FindAsync(id);
        if (player == null)
        {
            return NotFound(new { message = $"Player with ID {id} not found." });
        }

        player.Name = dto.Name.Trim();
        player.Country = dto.Country.Trim();
        player.Role = dto.Role.Trim();
        player.BattingStyle = dto.BattingStyle?.Trim();
        player.BowlingStyle = dto.BowlingStyle?.Trim();
        player.DateOfBirth = dto.DateOfBirth.HasValue ? DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc) : null;
        player.ImageUrl = dto.ImageUrl?.Trim();
        player.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Delete a player by ID.
    /// Example: DELETE /api/players/1
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePlayer(int id)
    {
        var player = await _context.Players.FindAsync(id);
        if (player == null)
        {
            return NotFound(new { message = $"Player with ID {id} not found." });
        }

        _context.Players.Remove(player);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Seed sample cricket players for quick testing.
    /// Example: POST /api/players/seed
    /// </summary>
    [HttpPost("seed")]
    public async Task<ActionResult> SeedSamplePlayers()
    {
        if (await _context.Players.AnyAsync())
        {
            return Ok(new { message = "Database already contains players. Skipping seed." });
        }

        var samplePlayers = new List<Player>
        {
            new()
            {
                Name = "Virat Kohli",
                Country = "India",
                Role = "Batsman",
                BattingStyle = "Right-hand bat",
                BowlingStyle = "Right-arm medium",
                DateOfBirth = new DateTime(1988, 11, 5, 0, 0, 0, DateTimeKind.Utc),
                ImageUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Wanindu Hasaranga",
                Country = "Sri Lanka",
                Role = "All-Rounder",
                BattingStyle = "Right-hand bat",
                BowlingStyle = "Right-arm leg break",
                DateOfBirth = new DateTime(1997, 7, 29, 0, 0, 0, DateTimeKind.Utc),
                ImageUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Pat Cummins",
                Country = "Australia",
                Role = "Bowler",
                BattingStyle = "Right-hand bat",
                BowlingStyle = "Right-arm fast",
                DateOfBirth = new DateTime(1993, 5, 8, 0, 0, 0, DateTimeKind.Utc),
                ImageUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Babar Azam",
                Country = "Pakistan",
                Role = "Batsman",
                BattingStyle = "Right-hand bat",
                BowlingStyle = "Right-arm off break",
                DateOfBirth = new DateTime(1994, 10, 15, 0, 0, 0, DateTimeKind.Utc),
                ImageUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Players.AddRange(samplePlayers);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Successfully seeded {samplePlayers.Count} players!", count = samplePlayers.Count });
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
}
