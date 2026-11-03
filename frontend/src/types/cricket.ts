// Types matching ASP.NET Core Backend DTOs

// ==========================================
// Player DTOs (from PlayerDtos.cs)
// ==========================================

export interface PlayerStatisticsDto {
  format: string;
  matchesPlayed: number;
  totalRuns: number;
  battingAverage: number;
  strikeRate: number;
  highestScore: number;
  centuries: number;
  fifties: number;
  totalWickets: number;
  bowlingAverage: number;
  bowlingEconomy: number;
  bestBowlingFigures?: string | null;
  lastCalculatedAt: string;
}

export interface PlayerResponseDto {
  id: number;
  name: string;
  country: string;
  role: string;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  dateOfBirth?: string | null;
  externalApiId?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  statistics?: PlayerStatisticsDto | null;
  formatStats?: FormatStatsDto | null;
}

export interface FormatStatsDto {
  t20?: PlayerStatisticsDto | null;
  odi?: PlayerStatisticsDto | null;
  test?: PlayerStatisticsDto | null;
}

export interface CreatePlayerStatisticsDto {
  format?: string;
  matchesPlayed: number;
  totalRuns: number;
  battingAverage: number;
  strikeRate: number;
  highestScore: number;
  centuries: number;
  fifties: number;
  totalWickets: number;
  bowlingAverage: number;
  bowlingEconomy: number;
  bestBowlingFigures?: string | null;
}

export interface CreatePlayerDto {
  name: string;
  country: string;
  role: string;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  dateOfBirth?: string | null;
  imageUrl?: string | null;
  statistics?: CreatePlayerStatisticsDto | null;
}

export interface UpdatePlayerDto {
  name: string;
  country: string;
  role: string;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  dateOfBirth?: string | null;
  imageUrl?: string | null;
  statistics?: CreatePlayerStatisticsDto | null;
}

// ==========================================
// CricAPI DTOs (from CricApiDtos.cs)
// ==========================================

export interface CricApiPlayerSearchItem {
  id: string;
  name: string;
  country: string;
}

export interface CricApiPlayerSearchResponse {
  status: string;
  data?: CricApiPlayerSearchItem[];
}

export interface CricApiStatItem {
  fn?: string;
  matchtype?: string;
  stat?: string;
  value?: string;
}

export interface CricApiPlayerInfoData {
  id: string;
  name: string;
  role?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  playerImg?: string | null;
  stats?: CricApiStatItem[];
}

// ==========================================
// AI Analysis DTOs (from AIAnalysisDtos.cs)
// ==========================================

export interface GenerateAnalysisRequestDto {
  customFocus?: string | null;
  opponentTeam?: string | null;
  format?: string | null;
  userId?: number | null;
}

export interface AIAnalysisResponseDto {
  id: number;
  playerId: number;
  playerName: string;
  country: string;
  role: string;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  imageUrl?: string | null;
  summary: string;
  strengths: string;
  weaknesses: string;
  recentFormTrend: string;
  recommendations: string;
  fullReportMarkdown: string;
  modelUsed: string;
  createdAt: string;
}

export interface ComparePlayersRequestDto {
  player1Id: number;
  player2Id: number;
  matchFormat?: string | null;
  pitchCondition?: string | null;
}

export interface PlayerComparisonResponseDto {
  player1: PlayerResponseDto;
  player2: PlayerResponseDto;
  matchFormat: string;
  comparisonSummary: string;
  battingComparison: string;
  bowlingComparison: string;
  tacticalVerdict: string;
  recommendedPick: string;
  modelUsed: string;
  analyzedAt: string;
}

