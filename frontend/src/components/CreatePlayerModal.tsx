import React, { useState } from 'react';
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { playersApi } from '../api/client';
import type { CreatePlayerDto } from '../types/cricket';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerCreated: () => void;
}

export const CreatePlayerModal: React.FC<CreatePlayerModalProps> = ({
  isOpen,
  onClose,
  onPlayerCreated,
}) => {
  // Player basic details
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('Batsman');
  const [battingStyle, setBattingStyle] = useState('Right-hand bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm fast-medium');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Performance stats
  const [includeStats, setIncludeStats] = useState(true);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(25);
  const [totalRuns, setTotalRuns] = useState<number>(850);
  const [battingAverage, setBattingAverage] = useState<number>(38.5);
  const [strikeRate, setStrikeRate] = useState<number>(135.0);
  const [highestScore, setHighestScore] = useState<number>(88);
  const [centuries, setCenturies] = useState<number>(0);
  const [fifties, setFifties] = useState<number>(6);
  const [totalWickets, setTotalWickets] = useState<number>(12);
  const [bowlingAverage, setBowlingAverage] = useState<number>(26.4);
  const [bowlingEconomy, setBowlingEconomy] = useState<number>(7.8);
  const [bestBowlingFigures, setBestBowlingFigures] = useState('3/22');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }
    if (!country.trim()) {
      setError('Country is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreatePlayerDto = {
      name: name.trim(),
      country: country.trim(),
      role,
      battingStyle: battingStyle || undefined,
      bowlingStyle: bowlingStyle !== 'None' ? bowlingStyle : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      imageUrl: imageUrl.trim() || undefined,
      statistics: includeStats
        ? {
            format: 'Overall Career',
            matchesPlayed: Number(matchesPlayed) || 1,
            totalRuns: Number(totalRuns) || 0,
            battingAverage: Number(battingAverage) || 0,
            strikeRate: Number(strikeRate) || 0,
            highestScore: Number(highestScore) || 0,
            centuries: Number(centuries) || 0,
            fifties: Number(fifties) || 0,
            totalWickets: Number(totalWickets) || 0,
            bowlingAverage: Number(bowlingAverage) || 0,
            bowlingEconomy: Number(bowlingEconomy) || 0,
            bestBowlingFigures: bestBowlingFigures.trim() || undefined,
          }
        : undefined,
    };

    try {
      await playersApi.createPlayer(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onPlayerCreated();
        onClose();
        resetForm();
      }, 700);
    } catch (err: unknown) {
      console.error('Failed to create player', err);
      setError('Failed to create player. Please verify database connection.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCountry('');
    setRole('Batsman');
    setBattingStyle('Right-hand bat');
    setBowlingStyle('Right-arm fast-medium');
    setDateOfBirth('');
    setImageUrl('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Create New Player</h2>
              <p className="text-xs text-slate-400">Add player details & current performance statistics to database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Player created successfully! Refreshing roster...</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Player Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Player Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travis Head, Sanju Samson..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Country / Nationality <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Australia, India, Sri Lanka..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Playing Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Batting Style</label>
                <select
                  value={battingStyle}
                  onChange={(e) => setBattingStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Right-hand bat">Right-hand bat</option>
                  <option value="Left-hand bat">Left-hand bat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bowling Style</label>
                <select
                  value={bowlingStyle}
                  onChange={(e) => setBowlingStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Right-arm fast">Right-arm fast</option>
                  <option value="Right-arm fast-medium">Right-arm fast-medium</option>
                  <option value="Right-arm medium">Right-arm medium</option>
                  <option value="Left-arm fast">Left-arm fast</option>
                  <option value="Left-arm fast-medium">Left-arm fast-medium</option>
                  <option value="Right-arm off break">Right-arm off break</option>
                  <option value="Right-arm leg break">Right-arm leg break</option>
                  <option value="Left-arm orthodox">Left-arm orthodox</option>
                  <option value="Slow left-arm chinaman">Slow left-arm chinaman</option>
                  <option value="None">None / Occasional</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profile Photo URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Current / Career Performance Statistics */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Current Performance & Statistics
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>Include Statistics</span>
              </label>
            </div>

            {includeStats && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-4">
                {/* Batting Stats */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    🏏 Batting Record
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Matches</label>
                      <input
                        type="number"
                        min="0"
                        value={matchesPlayed}
                        onChange={(e) => setMatchesPlayed(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Runs</label>
                      <input
                        type="number"
                        min="0"
                        value={totalRuns}
                        onChange={(e) => setTotalRuns(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Bat Avg</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={battingAverage}
                        onChange={(e) => setBattingAverage(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Strike Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={strikeRate}
                        onChange={(e) => setStrikeRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Highest Score</label>
                      <input
                        type="number"
                        min="0"
                        value={highestScore}
                        onChange={(e) => setHighestScore(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">100s</label>
                      <input
                        type="number"
                        min="0"
                        value={centuries}
                        onChange={(e) => setCenturies(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">50s</label>
                      <input
                        type="number"
                        min="0"
                        value={fifties}
                        onChange={(e) => setFifties(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bowling Stats */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    ⚡ Bowling Record
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Wickets</label>
                      <input
                        type="number"
                        min="0"
                        value={totalWickets}
                        onChange={(e) => setTotalWickets(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Bowl Avg</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bowlingAverage}
                        onChange={(e) => setBowlingAverage(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Economy</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bowlingEconomy}
                        onChange={(e) => setBowlingEconomy(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Best Figures</label>
                      <input
                        type="text"
                        placeholder="e.g. 4/18"
                        value={bestBowlingFigures}
                        onChange={(e) => setBestBowlingFigures(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-2 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save Player</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

