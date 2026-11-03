import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  FileText,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { analysisApi } from '../api/client';
import type { PlayerResponseDto, AIAnalysisResponseDto } from '../types/cricket';

interface AIReportViewProps {
  player: PlayerResponseDto | null;
  onClose?: () => void;
}

export const AIReportView: React.FC<AIReportViewProps> = ({ player, onClose }) => {
  const [format, setFormat] = useState('T20');
  const [opponentTeam, setOpponentTeam] = useState('Australia');
  const [customFocus, setCustomFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResponseDto | null>(null);
  const [history, setHistory] = useState<AIAnalysisResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<'tactical' | 'full'>('tactical');
  const [error, setError] = useState<string | null>(null);

  // Fetch player's historical analyses when selected
  useEffect(() => {
    if (!player) {
      setCurrentAnalysis(null);
      setHistory([]);
      return;
    }

    const loadPlayerHistory = async () => {
      try {
        const analyses = await analysisApi.getPlayerAnalyses(player.id);
        setHistory(analyses);
        if (analyses.length > 0) {
          setCurrentAnalysis(analyses[0]);
        } else {
          setCurrentAnalysis(null);
        }
      } catch (err) {
        console.error('Failed to load player history', err);
      }
    };

    loadPlayerHistory();
  }, [player]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    setLoading(true);
    setError(null);
    try {
      const report = await analysisApi.generatePlayerAnalysis(player.id, {
        format,
        opponentTeam: opponentTeam.trim() || undefined,
        customFocus: customFocus.trim() || undefined,
      });
      setCurrentAnalysis(report);
      setHistory((prev) => [report, ...prev]);
    } catch (err: unknown) {
      console.error('Scouting analysis failed', err);
      setError('Failed to generate tactical analysis. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const splitBulletPoints = (text: string): string[] => {
    if (!text) return [];
    return text
      .split(/\r?\n|;/)
      .map((item) => item.replace(/^[•\-*\d.\s]+/, '').trim())
      .filter((item) => item.length > 0);
  };

  if (!player) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500">
          <BrainCircuit className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-200 text-base">No Player Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Click <strong>"AI Scout"</strong> on any cricketer from the roster to generate real-time AI scouting dossiers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
              {player.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{player.name}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {player.country}
              </span>
            </div>
            <p className="text-xs text-emerald-400 font-medium">{player.role}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Match Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="T20">T20 (International / League)</option>
              <option value="ODI">One Day International (ODI)</option>
              <option value="Test">Test Match</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Opposition Team
            </label>
            <input
              type="text"
              placeholder="e.g. Australia, England, CSK..."
              value={opponentTeam}
              onChange={(e) => setOpponentTeam(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Custom Tactical Focus (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Struggles against left-arm angle, Death overs boundary rate, Spin choke in middle overs..."
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{history.length} saved report{history.length > 1 ? 's' : ''}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ml-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-500/10 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini Analyzing...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Generate AI Dossier</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800">
            {error}
          </p>
        )}
      </form>

      {/* Analysis Output */}
      {currentAnalysis ? (
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Metadata pill */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
            <span className="font-semibold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Model: {currentAnalysis.modelUsed}
            </span>
            <span className="text-slate-500">
              {new Date(currentAnalysis.createdAt).toLocaleDateString()} at{' '}
              {new Date(currentAnalysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('tactical')}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                activeTab === 'tactical'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Breakdown
            </button>
            <button
              onClick={() => setActiveTab('full')}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                activeTab === 'full'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Report Markdown
            </button>
          </div>

          {activeTab === 'tactical' ? (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Executive Tactical Summary
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">{currentAnalysis.summary}</p>
              </div>

              {/* Strengths */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Core Strengths & Threat Profile
                </p>
                <div className="space-y-1.5">
                  {splitBulletPoints(currentAnalysis.strengths).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Identified Vulnerabilities & Dismissal Tendencies
                </p>
                <div className="space-y-1.5">
                  {splitBulletPoints(currentAnalysis.weaknesses).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-rose-400 font-bold leading-none mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Trend */}
              {currentAnalysis.recentFormTrend && (
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Recent Form & Momentum
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{currentAnalysis.recentFormTrend}</p>
                </div>
              )}

              {/* Tactical Recommendations */}
              <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Coach & Tactical Recommendations
                </p>
                <div className="space-y-1.5">
                  {splitBulletPoints(currentAnalysis.recommendations).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-amber-400 font-bold leading-none mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {currentAnalysis.fullReportMarkdown}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          <BrainCircuit className="w-10 h-10 mx-auto mb-2 text-slate-700" />
          Click <strong>"Generate AI Dossier"</strong> above to produce a tactical analysis report for {player.name}.
        </div>
      )}
    </div>
  );
};
