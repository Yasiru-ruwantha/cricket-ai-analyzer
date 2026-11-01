namespace CricketAnalyzer.API.Models;

public class BowlingPerformance
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public int MatchId { get; set; }
    public Match Match { get; set; } = null!;

    public int InningsNumber { get; set; } = 1;
    public decimal OversBowled { get; set; } // e.g. 4.0, 3.2
    public int Maidens { get; set; }
    public int RunsConceded { get; set; }
    public int WicketsTaken { get; set; }
    public decimal EconomyRate { get; set; }
    public int Wides { get; set; }
    public int NoBalls { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
