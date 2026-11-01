using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;

namespace CricketAnalyzer.API.Services;

public interface IAIAnalyzerService
{
    /// <summary>
    /// Generates deep AI performance analysis, strengths, weaknesses, and tactical recommendations for a player.
    /// Stores the analysis in the database and returns the generated entity.
    /// </summary>
    Task<AIAnalysis> GeneratePlayerAnalysisAsync(int playerId, GenerateAnalysisRequestDto? request = null);

    /// <summary>
    /// Generates head-to-head AI analysis comparing two players under specific match conditions.
    /// </summary>
    Task<PlayerComparisonResponseDto> ComparePlayersAsync(ComparePlayersRequestDto request);
}
