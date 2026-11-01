namespace CricketAnalyzer.API.Models;

public class PlayerStatistics
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public string Format { get; set; } = "Overall"; // Overall, T20, ODI, Test
    public int MatchesPlayed { get; set; }

    // Batting stats
    public int TotalRuns { get; set; }
    public decimal BattingAverage { get; set; }
    public decimal StrikeRate { get; set; }
    public int HighestScore { get; set; }
    public int Centuries { get; set; }
    public int Fifties { get; set; }

    // Bowling stats
    public int TotalWickets { get; set; }
    public decimal BowlingAverage { get; set; }
    public decimal BowlingEconomy { get; set; }
    public string? BestBowlingFigures { get; set; } // e.g. "5/18"

    public DateTime LastCalculatedAt { get; set; } = DateTime.UtcNow;
}
