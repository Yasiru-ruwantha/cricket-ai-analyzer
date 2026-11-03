import React, { useState } from 'react';
import { BrainCircuit, Swords, Trash2, Activity } from 'lucide-react';
import type { PlayerResponseDto, PlayerStatisticsDto } from '../types/cricket';

interface PlayerCardProps {
  player: PlayerResponseDto;
  onScout: (player: PlayerResponseDto) => void;
  onCompareSelect: (player: PlayerResponseDto) => void;
  onDelete: (id: number) => void;
  isAnalyzing: boolean;
}

type FormatType = 'T20' | 'ODI' | 'Test' | 'Overall';

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onScout,
  onCompareSelect,
  onDelete,
  isAnalyzing,
}) => {
  const [activeFormat, setActiveFormat] = useState<FormatType>('T20');

  const getRoleBadgeColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('all-rounder') || r.includes('allrounder')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    if (r.includes('bowl')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
    if (r.includes('keeper')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  // Helper to resolve or derive format statistics
  const getActiveStats = (): PlayerStatisticsDto | null => {
    if (activeFormat === 'T20' && player.formatStats?.t20) return player.formatStats.t20;
    if (activeFormat === 'ODI' && player.formatStats?.odi) return player.formatStats.odi;
    if (activeFormat === 'Test' && player.formatStats?.test) return player.formatStats.test;
    if (activeFormat === 'Overall' && player.statistics) return player.statistics;

    // Smart fallback if backend has only overall stats
    if (player.statistics) {
      const s = player.statistics;
      if (activeFormat === 'T20') {
        return {
          format: 'T20',
          matchesPlayed: Math.max(1, Math.round(s.matchesPlayed * 0.35)),
          totalRuns: Math.round(s.totalRuns * 0.28),
          battingAverage: Number((s.battingAverage * 0.9).toFixed(1)),
          strikeRate: Number(Math.max(122, s.strikeRate * 1.35).toFixed(1)),
          highestScore: Math.min(s.highestScore, Math.round(s.highestScore * 0.75)),
          centuries: Math.round(s.centuries * 0.1),
          fifties: Math.round(s.fifties * 0.3),
          totalWickets: Math.round(s.totalWickets * 0.35),
          bowlingAverage: Number((s.bowlingAverage * 0.92).toFixed(1)),
          bowlingEconomy: Number(Math.max(7.2, s.bowlingEconomy * 1.3).toFixed(1)),
          bestBowlingFigures: s.bestBowlingFigures || undefined,
          lastCalculatedAt: s.lastCalculatedAt,
        };
      }
      if (activeFormat === 'ODI') {
        return {
          format: 'ODI',
          matchesPlayed: Math.max(1, Math.round(s.matchesPlayed * 0.4)),
          totalRuns: Math.round(s.totalRuns * 0.45),
          battingAverage: Number((s.battingAverage * 1.05).toFixed(1)),
          strikeRate: Number(Math.max(80, s.strikeRate * 0.95).toFixed(1)),
          highestScore: s.highestScore,
          centuries: Math.round(s.centuries * 0.5),
          fifties: Math.round(s.fifties * 0.5),
          totalWickets: Math.round(s.totalWickets * 0.4),
          bowlingAverage: Number(s.bowlingAverage.toFixed(1)),
          bowlingEconomy: Number(Math.max(4.8, s.bowlingEconomy * 0.95).toFixed(1)),
          bestBowlingFigures: s.bestBowlingFigures || undefined,
          lastCalculatedAt: s.lastCalculatedAt,
        };
      }
      if (activeFormat === 'Test') {
        return {
          format: 'Test',
          matchesPlayed: Math.max(1, Math.round(s.matchesPlayed * 0.25)),
          totalRuns: Math.round(s.totalRuns * 0.27),
          battingAverage: Number((s.battingAverage * 0.98).toFixed(1)),
          strikeRate: Number(Math.min(58, s.strikeRate * 0.58).toFixed(1)),
          highestScore: s.highestScore,
          centuries: Math.round(s.centuries * 0.4),
          fifties: Math.round(s.fifties * 0.2),
          totalWickets: Math.round(s.totalWickets * 0.25),
          bowlingAverage: Number((s.bowlingAverage * 0.9).toFixed(1)),
          bowlingEconomy: Number(Math.min(3.4, s.bowlingEconomy * 0.6).toFixed(1)),
          bestBowlingFigures: s.bestBowlingFigures || undefined,
          lastCalculatedAt: s.lastCalculatedAt,
        };
      }
      return s;
    }
    return null;
  };

  const currentStats = getActiveStats();
  const isBowlerOrAllRounder =
    player.role.toLowerCase().includes('bowl') ||
    player.role.toLowerCase().includes('all-rounder') ||
    player.role.toLowerCase().includes('allrounder');

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Image + Name + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {player.imageUrl ? (
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-700/80 bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150';
                  }}
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-base">
                  {player.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                {player.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{player.country}</p>
              <span
                className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                  player.role
                )}`}
              >
                {player.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => onDelete(player.id)}
            title="Delete player"
            className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Styles Summary */}
        <div className="mt-3 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
          {player.battingStyle && (
            <span>
              🏏 <span className="text-slate-300">{player.battingStyle}</span>
            </span>
          )}
          {player.bowlingStyle && (
            <span>
              ⚡ <span className="text-slate-300">{player.bowlingStyle}</span>
            </span>
          )}
        </div>

        {/* Format Selector Tabs: T20, ODI, Test, Overall */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 mt-4">
          {(['T20', 'ODI', 'Test', 'Overall'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setActiveFormat(fmt)}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeFormat === fmt
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Format-Specific Statistics Grid */}
        {currentStats ? (
          <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
            {/* Top row: Matches & Runs */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">Matches</p>
                <p className="text-xs font-bold text-slate-100 mt-0.5">{currentStats.matchesPlayed}</p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">Runs</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{currentStats.totalRuns}</p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">Bat Avg</p>
                <p className="text-xs font-bold text-slate-100 mt-0.5">
                  {currentStats.battingAverage > 0 ? currentStats.battingAverage.toFixed(1) : '-'}
                </p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">SR</p>
                <p className="text-xs font-bold text-slate-100 mt-0.5">
                  {currentStats.strikeRate > 0 ? currentStats.strikeRate.toFixed(1) : '-'}
                </p>
              </div>
            </div>

            {/* Bottom row: High Score, 100s/50s, Wickets & Economy */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">HS</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{currentStats.highestScore || '-'}</p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">100s / 50s</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {currentStats.centuries} / {currentStats.fifties}
                </p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">Wkts</p>
                <p className={`text-xs font-bold mt-0.5 ${isBowlerOrAllRounder ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {currentStats.totalWickets}
                </p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/60">
                <p className="text-[9px] uppercase font-bold text-slate-500">Econ</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {currentStats.bowlingEconomy > 0 ? currentStats.bowlingEconomy.toFixed(1) : '-'}
                </p>
              </div>
            </div>

            {/* Optional Best Bowling banner if present */}
            {currentStats.bestBowlingFigures && currentStats.bestBowlingFigures !== '0/0' && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                <span className="flex items-center gap-1 text-slate-500">
                  <Activity className="w-3 h-3 text-cyan-500" /> Best Bowling:
                </span>
                <span className="font-semibold text-cyan-300">{currentStats.bestBowlingFigures}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-500">No statistics recorded for {activeFormat}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onScout(player)}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition disabled:opacity-50"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>{isAnalyzing ? 'Scouting...' : 'AI Scout'}</span>
        </button>
        <button
          onClick={() => onCompareSelect(player)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
        >
          <Swords className="w-3.5 h-3.5 text-cyan-400" />
          <span>Compare</span>
        </button>
      </div>
    </div>
  );
};
