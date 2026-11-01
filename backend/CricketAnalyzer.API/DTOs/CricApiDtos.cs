using System.Text.Json.Serialization;

namespace CricketAnalyzer.API.DTOs;

public class CricApiPlayerSearchResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public List<CricApiPlayerSearchItem>? Data { get; set; }
}

public class CricApiPlayerSearchItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;
}

public class CricApiPlayerInfoResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public CricApiPlayerInfoData? Data { get; set; }
}

public class CricApiPlayerInfoData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("battingStyle")]
    public string? BattingStyle { get; set; }

    [JsonPropertyName("bowlingStyle")]
    public string? BowlingStyle { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; }

    [JsonPropertyName("dateOfBirth")]
    public string? DateOfBirth { get; set; }

    [JsonPropertyName("placeOfBirth")]
    public string? PlaceOfBirth { get; set; }

    [JsonPropertyName("playerImg")]
    public string? PlayerImg { get; set; }

    [JsonPropertyName("stats")]
    public List<CricApiStatItem>? Stats { get; set; }
}

public class CricApiStatItem
{
    [JsonPropertyName("fn")]
    public string? Fn { get; set; }

    [JsonPropertyName("matchtype")]
    public string? Matchtype { get; set; }

    [JsonPropertyName("stat")]
    public string? Stat { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}
