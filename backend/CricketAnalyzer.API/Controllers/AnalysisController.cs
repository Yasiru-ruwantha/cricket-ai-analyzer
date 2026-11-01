using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CricketAnalyzer.API.Data;
using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;
using CricketAnalyzer.API.Services;

namespace CricketAnalyzer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly IAIAnalyzerService _aiService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalysisController> _logger;

    public AnalysisController(
        IAIAnalyzerService aiService,
        ApplicationDbContext context,
        ILogger<AnalysisController> logger)
    {
        _aiService = aiService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generates a new AI scouting analysis for a player, saves it to PostgreSQL, and returns the report.
    /// Example: POST /api/analysis/player/7
    /// </summary>
    [HttpPost("player/{playerId:int}")]
    public async Task<ActionResult<AIAnalysisResponseDto>> GeneratePlayerAnalysis(
        int playerId, 
        [FromBody] GenerateAnalysisRequestDto? request)
    {
        try
        {
            var analysis = await _aiService.GeneratePlayerAnalysisAsync(playerId, request);
            
            // Fetch player details to populate response DTO
            var player = await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == playerId);

            return CreatedAtAction(
                nameof(GetAnalysisById), 
                new { id = analysis.Id }, 
                MapToResponseDto(analysis, player));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating analysis for player {PlayerId}", playerId);
            return StatusCode(500, new { message = "An error occurred while generating AI analysis.", error = ex.Message });
        }
    }

    /// <summary>
    /// Gets all historical AI analyses for a specific player (ordered by newest first).
    /// Example: GET /api/analysis/player/7
    /// </summary>
    [HttpGet("player/{playerId:int}")]
    public async Task<ActionResult<IEnumerable<AIAnalysisResponseDto>>> GetPlayerAnalyses(int playerId)
    {
        var player = await _context.Players
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == playerId);

        if (player == null)
        {
            return NotFound(new { message = $"Player with ID {playerId} not found." });
        }

        var analyses = await _context.AIAnalyses
            .Where(a => a.PlayerId == playerId)
            .OrderByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(analyses.Select(a => MapToResponseDto(a, player)));
    }

    /// <summary>
    /// Gets a single AI analysis by its primary ID.
    /// Example: GET /api/analysis/1
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AIAnalysisResponseDto>> GetAnalysisById(int id)
    {
        var analysis = await _context.AIAnalyses
            .Include(a => a.Player)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (analysis == null)
        {
            return NotFound(new { message = $"Analysis with ID {id} not found." });
        }

        return Ok(MapToResponseDto(analysis, analysis.Player));
    }

    /// <summary>
    /// Performs an AI head-to-head comparison between two players for specific match conditions.
    /// Example: POST /api/analysis/compare
    /// </summary>
    [HttpPost("compare")]
    public async Task<ActionResult<PlayerComparisonResponseDto>> ComparePlayers(
        [FromBody] ComparePlayersRequestDto request)
    {
        if (request.Player1Id <= 0 || request.Player2Id <= 0)
        {
            return BadRequest(new { message = "Both Player1Id and Player2Id must be valid IDs." });
        }

        if (request.Player1Id == request.Player2Id)
        {
            return BadRequest(new { message = "Cannot compare a player against themselves." });
        }

        try
        {
            var comparison = await _aiService.ComparePlayersAsync(request);
            return Ok(comparison);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error comparing players {P1} and {P2}", request.Player1Id, request.Player2Id);
            return StatusCode(500, new { message = "An error occurred while comparing players.", error = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a saved AI analysis report by ID.
    /// Example: DELETE /api/analysis/1
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAnalysis(int id)
    {
        var analysis = await _context.AIAnalyses.FindAsync(id);
        if (analysis == null)
        {
            return NotFound(new { message = $"Analysis with ID {id} not found." });
        }

        _context.AIAnalyses.Remove(analysis);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static AIAnalysisResponseDto MapToResponseDto(AIAnalysis analysis, Player? player)
    {
        return new AIAnalysisResponseDto
        {
            Id = analysis.Id,
            PlayerId = analysis.PlayerId,
            PlayerName = player?.Name ?? "Unknown Player",
            Country = player?.Country ?? "Unknown",
            Role = player?.Role ?? "Cricketer",
            BattingStyle = player?.BattingStyle,
            BowlingStyle = player?.BowlingStyle,
            ImageUrl = player?.ImageUrl,
            Summary = analysis.Summary,
            Strengths = analysis.Strengths,
            Weaknesses = analysis.Weaknesses,
            RecentFormTrend = analysis.RecentFormTrend,
            Recommendations = analysis.Recommendations,
            FullReportMarkdown = analysis.FullReportMarkdown,
            ModelUsed = analysis.ModelUsed,
            CreatedAt = analysis.CreatedAt
        };
    }
}
