namespace CricketAnalyzer.API.Models;

public class AIAnalysis
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public int? UserId { get; set; }
    public User? User { get; set; }

    public string Summary { get; set; } = string.Empty;
    public string Strengths { get; set; } = string.Empty;
    public string Weaknesses { get; set; } = string.Empty;
    public string RecentFormTrend { get; set; } = string.Empty;
    public string Recommendations { get; set; } = string.Empty;
    public string FullReportMarkdown { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty; // e.g. "Gemini", "Claude", "OpenAI"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
