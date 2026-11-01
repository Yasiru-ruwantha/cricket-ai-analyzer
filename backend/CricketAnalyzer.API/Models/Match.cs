namespace CricketAnalyzer.API.Models;

public class Match
{
    public int Id { get; set; }
    public string? ExternalMatchId { get; set; }
    public string Format { get; set; } = "T20"; // T20, ODI, Test
    public DateTime MatchDate { get; set; }
    public string Team1 { get; set; } = string.Empty;
    public string Team2 { get; set; } = string.Empty;
    public string? Venue { get; set; }
    public string? Result { get; set; }
    public string? Season { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<BattingPerformance> BattingPerformances { get; set; } = new List<BattingPerformance>();
    public ICollection<BowlingPerformance> BowlingPerformances { get; set; } = new List<BowlingPerformance>();
}
