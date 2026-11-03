import axios from 'axios';
import type {
  PlayerResponseDto,
  CreatePlayerDto,
  UpdatePlayerDto,
  CricApiPlayerSearchItem,
  GenerateAnalysisRequestDto,
  AIAnalysisResponseDto,
  ComparePlayersRequestDto,
  PlayerComparisonResponseDto,
} from '../types/cricket';

// Base Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5118/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// Players API Services
// ==========================================

export const playersApi = {
  /**
   * Get all players from local database with optional search filter.
   * GET /api/players?search={search}
   */
  getPlayers: async (search?: string): Promise<PlayerResponseDto[]> => {
    const params = search && search.trim() ? { search: search.trim() } : {};
    const response = await apiClient.get<PlayerResponseDto[]>('/players', { params });
    return response.data;
  },

  /**
   * Get a single player by local database ID.
   * GET /api/players/{id}
   */
  getPlayerById: async (id: number): Promise<PlayerResponseDto> => {
    const response = await apiClient.get<PlayerResponseDto>(`/players/${id}`);
    return response.data;
  },

  /**
   * Search external CricAPI directly for players by name.
   * GET /api/players/external-search?query={query}
   */
  searchExternalPlayers: async (query: string): Promise<CricApiPlayerSearchItem[]> => {
    const response = await apiClient.get<CricApiPlayerSearchItem[]>('/players/external-search', {
      params: { query: query.trim() },
    });
    return response.data;
  },

  /**
   * Import player from CricAPI into local PostgreSQL database by external ID.
   * POST /api/players/import/{externalId}
   */
  importPlayer: async (externalId: string): Promise<PlayerResponseDto> => {
    const response = await apiClient.post<PlayerResponseDto>(`/players/import/${encodeURIComponent(externalId.trim())}`);
    return response.data;
  },

  /**
   * Create a new player manually.
   * POST /api/players
   */
  createPlayer: async (dto: CreatePlayerDto): Promise<PlayerResponseDto> => {
    const response = await apiClient.post<PlayerResponseDto>('/players', dto);
    return response.data;
  },

  /**
   * Update an existing player.
   * PUT /api/players/{id}
   */
  updatePlayer: async (id: number, dto: UpdatePlayerDto): Promise<void> => {
    await apiClient.put(`/players/${id}`, dto);
  },

  /**
   * Delete a player by ID.
   * DELETE /api/players/{id}
   */
  deletePlayer: async (id: number): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
  },

  /**
   * Seed sample cricket players into the database for testing.
   * POST /api/players/seed
   */
  seedPlayers: async (): Promise<{ message: string; count?: number }> => {
    const response = await apiClient.post<{ message: string; count?: number }>('/players/seed');
    return response.data;
  },
};

// ==========================================
// AI Analysis API Services
// ==========================================

export const analysisApi = {
  /**
   * Generate a tactical AI scouting analysis for a player.
   * POST /api/analysis/player/{playerId}
   */
  generatePlayerAnalysis: async (
    playerId: number,
    request?: GenerateAnalysisRequestDto
  ): Promise<AIAnalysisResponseDto> => {
    const response = await apiClient.post<AIAnalysisResponseDto>(
      `/analysis/player/${playerId}`,
      request || {}
    );
    return response.data;
  },

  /**
   * Get all historical scouting analyses for a specific player.
   * GET /api/analysis/player/{playerId}
   */
  getPlayerAnalyses: async (playerId: number): Promise<AIAnalysisResponseDto[]> => {
    const response = await apiClient.get<AIAnalysisResponseDto[]>(`/analysis/player/${playerId}`);
    return response.data;
  },

  /**
   * Get a specific AI analysis by report ID.
   * GET /api/analysis/{id}
   */
  getAnalysisById: async (id: number): Promise<AIAnalysisResponseDto> => {
    const response = await apiClient.get<AIAnalysisResponseDto>(`/analysis/${id}`);
    return response.data;
  },

  /**
   * Perform an AI head-to-head comparison between two players.
   * POST /api/analysis/compare
   */
  comparePlayers: async (request: ComparePlayersRequestDto): Promise<PlayerComparisonResponseDto> => {
    const response = await apiClient.post<PlayerComparisonResponseDto>('/analysis/compare', request);
    return response.data;
  },

  /**
   * Delete an analysis report by ID.
   * DELETE /api/analysis/{id}
   */
  deleteAnalysis: async (id: number): Promise<void> => {
    await apiClient.delete(`/analysis/${id}`);
  },
};

export default apiClient;

