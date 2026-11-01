using System.ComponentModel.DataAnnotations;

namespace CricketAnalyzer.API.DTOs;

public class CreatePlayerDto
{
    [Required(ErrorMessage = "Player name is required.")]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Country is required.")]
    [StringLength(50)]
    public string Country { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required (e.g., Batsman, Bowler, All-Rounder, Wicket-Keeper).")]
    public string Role { get; set; } = string.Empty;

    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdatePlayerDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Country { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ImageUrl { get; set; }
}

public class PlayerResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ExternalApiId { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public PlayerStatisticsDto? Statistics { get; set; }
}

public class PlayerStatisticsDto
{
    public string Format { get; set; } = "Overall";
    public int MatchesPlayed { get; set; }
    public int TotalRuns { get; set; }
    public decimal BattingAverage { get; set; }
    public decimal StrikeRate { get; set; }
    public int HighestScore { get; set; }
    public int Centuries { get; set; }
    public int Fifties { get; set; }
    public int TotalWickets { get; set; }
    public decimal BowlingAverage { get; set; }
    public decimal BowlingEconomy { get; set; }
    public string? BestBowlingFigures { get; set; }
    public DateTime LastCalculatedAt { get; set; }
}
