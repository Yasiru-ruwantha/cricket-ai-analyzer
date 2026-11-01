namespace CricketAnalyzer.API.Models;

public class BattingPerformance
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public int MatchId { get; set; }
    public Match Match { get; set; } = null!;

    public int InningsNumber { get; set; } = 1;
    public int RunsScored { get; set; }
    public int BallsFaced { get; set; }
    public int Fours { get; set; }
    public int Sixes { get; set; }
    public decimal StrikeRate { get; set; }
    public bool IsOut { get; set; } = true;
    public string? DismissalType { get; set; } // Caught, Bowled, LBW, Run Out, Not Out, etc.

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
