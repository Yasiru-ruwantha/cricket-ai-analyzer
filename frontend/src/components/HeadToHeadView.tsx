import React, { useState } from 'react';
import {
  Swords,
  BrainCircuit,
  Trophy,
  Loader2,
  AlertCircle,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react';
import { analysisApi } from '../api/client';
import type { PlayerResponseDto, PlayerComparisonResponseDto } from '../types/cricket';

interface HeadToHeadViewProps {
  players: PlayerResponseDto[];
  initialPlayer1Id?: number | null;
}

export const HeadToHeadView: React.FC<HeadToHeadViewProps> = ({
  players,
  initialPlayer1Id,
}) => {
  const [player1Id, setPlayer1Id] = useState<number>(
    initialPlayer1Id || (players.length > 0 ? players[0].id : 0)
  );
  const [player2Id, setPlayer2Id] = useState<number>(
    players.length > 1 ? players[1].id : 0
  );
  const [format, setFormat] = useState('T20');
  const [pitchCondition, setPitchCondition] = useState(
    'Turning track with grip and variable bounce'
  );
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<PlayerComparisonResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Id || !player2Id) {
      setError('Please select both players.');
      return;
    }
    if (player1Id === player2Id) {
      setError('Please select two different players for a head-to-head comparison.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await analysisApi.comparePlayers({
        player1Id,
        player2Id,
        matchFormat: format,
        pitchCondition: pitchCondition.trim() || undefined,
      });
      setComparison(result);
    } catch (err: unknown) {
      console.error('Head-to-head comparison failed', err);
      setError('Failed to run AI comparison. Make sure both players exist and backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const presetPitchConditions = [
    'Turning track with grip and variable bounce (Colombo / Chennai)',
    'Fast & bouncy wicket with seam movement (Perth / Centurion)',
    'Flat batting highway with short boundaries (Bangalore / Mumbai)',
    'Overcast green top with lateral swing (Lord\'s / Headingley)',
  ];

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Head-to-Head Tactical Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare any two international players under simulated pitch conditions and match formats using Gemini AI
            </p>
          </div>
        </div>

        {/* Selection Form */}
        <form onSubmit={handleCompare} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player 1 Selector */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Player 1 (Contender A)
              </label>
              <select
                value={player1Id}
                onChange={(e) => setPlayer1Id(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={0}>-- Select Player 1 --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === player2Id}>
                    {p.name} ({p.country} • {p.role})
                  </option>
                ))}
              </select>

              {player1 && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                  {player1.imageUrl && (
                    <img
                      src={player1.imageUrl}
                      alt={player1.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                    />
                  )}
                  <div>
                    <span className="font-semibold">{player1.name}</span>
                    <p className="text-[11px] text-slate-400">
                      Avg: {player1.statistics?.battingAverage?.toFixed(1) ?? '-'} | SR: {player1.statistics?.strikeRate?.toFixed(1) ?? '-'} | Wkts: {player1.statistics?.totalWickets ?? '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Player 2 Selector */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                Player 2 (Contender B)
              </label>
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>-- Select Player 2 --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === player1Id}>
                    {p.name} ({p.country} • {p.role})
                  </option>
                ))}
              </select>

              {player2 && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                  {player2.imageUrl && (
                    <img
                      src={player2.imageUrl}
                      alt={player2.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                    />
                  )}
                  <div>
                    <span className="font-semibold">{player2.name}</span>
                    <p className="text-[11px] text-slate-400">
                      Avg: {player2.statistics?.battingAverage?.toFixed(1) ?? '-'} | SR: {player2.statistics?.strikeRate?.toFixed(1) ?? '-'} | Wkts: {player2.statistics?.totalWickets ?? '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Match Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="T20">T20 International / Franchise</option>
                <option value="ODI">One Day International (ODI)</option>
                <option value="Test">Test Match</option>
                <option value="Overall">All Formats (Aggregate)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Pitch & Environmental Conditions
              </label>
              <input
                type="text"
                value={pitchCondition}
                onChange={(e) => setPitchCondition(e.target.value)}
                placeholder="e.g. Turning track, Green seamer, Flat highway..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
            {presetPitchConditions.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setPitchCondition(preset)}
                className="text-[10px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                {preset.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !player1Id || !player2Id || player1Id === player2Id}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simulating AI Matchup...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                <span>Run Head-to-Head AI Analysis</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          {/* Verdict Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 p-5 rounded-2xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" /> AI Tactical Verdict
                </span>
                <p className="text-sm font-semibold text-slate-100 mt-1 leading-relaxed">
                  {comparison.tacticalVerdict}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-xl text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Pick</span>
                <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> {comparison.recommendedPick}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batting Comparison */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" /> Batting Discipline & Impact
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{comparison.battingComparison}</p>
            </div>

            {/* Bowling Comparison */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> Bowling Threat & Economy
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{comparison.bowlingComparison}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Matchup Overview
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{comparison.comparisonSummary}</p>
          </div>

          {/* Model Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>Model Engine: {comparison.modelUsed}</span>
            <span>Analyzed at: {new Date(comparison.analyzedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
