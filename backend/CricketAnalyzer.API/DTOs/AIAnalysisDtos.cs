namespace CricketAnalyzer.API.DTOs;

public class GenerateAnalysisRequestDto
{
    /// <summary>
    /// Optional specific tactical angle (e.g. "Spin bowling vulnerability", "Death overs pacing", "Powerplay bowling").
    /// </summary>
    public string? CustomFocus { get; set; }

    /// <summary>
    /// Optional specific opponent (e.g. "Australia", "England", "Chennai Super Kings").
    /// </summary>
    public string? OpponentTeam { get; set; }

    /// <summary>
    /// Optional match format focus (e.g. "T20", "ODI", "Test").
    /// </summary>
    public string? Format { get; set; }

    /// <summary>
    /// Optional User ID who requested the analysis.
    /// </summary>
    public int? UserId { get; set; }
}

public class AIAnalysisResponseDto
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public string? ImageUrl { get; set; }

    public string Summary { get; set; } = string.Empty;
    public string Strengths { get; set; } = string.Empty;
    public string Weaknesses { get; set; } = string.Empty;
    public string RecentFormTrend { get; set; } = string.Empty;
    public string Recommendations { get; set; } = string.Empty;
    public string FullReportMarkdown { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ComparePlayersRequestDto
{
    public int Player1Id { get; set; }
    public int Player2Id { get; set; }
    public string? MatchFormat { get; set; } = "Overall";
    public string? PitchCondition { get; set; } = "Standard";
}

public class PlayerComparisonResponseDto
{
    public PlayerResponseDto Player1 { get; set; } = null!;
    public PlayerResponseDto Player2 { get; set; } = null!;
    public string MatchFormat { get; set; } = "Overall";
    public string ComparisonSummary { get; set; } = string.Empty;
    public string BattingComparison { get; set; } = string.Empty;
    public string BowlingComparison { get; set; } = string.Empty;
    public string TacticalVerdict { get; set; } = string.Empty;
    public string RecommendedPick { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}
