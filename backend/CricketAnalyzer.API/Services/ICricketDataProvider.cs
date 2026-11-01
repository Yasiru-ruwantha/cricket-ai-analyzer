using CricketAnalyzer.API.DTOs;
using CricketAnalyzer.API.Models;

namespace CricketAnalyzer.API.Services;

public interface ICricketDataProvider
{
    /// <summary>
    /// Searches CricAPI for players matching the given name query.
    /// </summary>
    Task<IEnumerable<CricApiPlayerSearchItem>> SearchExternalPlayersAsync(string query);

    /// <summary>
    /// Fetches player details and stats from CricAPI, saves or updates the player in PostgreSQL, and returns the entity.
    /// </summary>
    Task<Player?> ImportPlayerByExternalIdAsync(string externalId);
}
