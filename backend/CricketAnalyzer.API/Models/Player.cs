namespace CricketAnalyzer.API.Models;

public class Player
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Batsman, Bowler, All-Rounder, Wicket-Keeper
    public string? BattingStyle { get; set; } // Right-hand bat, Left-hand bat
    public string? BowlingStyle { get; set; } // Right-arm fast, Right-arm spin, etc.
    public DateTime? DateOfBirth { get; set; }
    public string? ExternalApiId { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<BattingPerformance> BattingPerformances { get; set; } = new List<BattingPerformance>();
    public ICollection<BowlingPerformance> BowlingPerformances { get; set; } = new List<BowlingPerformance>();
    public PlayerStatistics? Statistics { get; set; }
    public ICollection<AIAnalysis> AIAnalyses { get; set; } = new List<AIAnalysis>();
}
