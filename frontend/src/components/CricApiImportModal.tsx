import React, { useState } from 'react';
import { Search, UserPlus, X, Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { playersApi } from '../api/client';
import type { CricApiPlayerSearchItem } from '../types/cricket';

interface CricApiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CricApiImportModal: React.FC<CricApiImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CricApiPlayerSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatusMessage(null);
    setSearching(true);
    try {
      const items = await playersApi.searchExternalPlayers(query);
      setResults(items);
      if (items.length === 0) {
        setStatusMessage({ type: 'error', text: `No international players found matching "${query}".` });
      }
    } catch (err: unknown) {
      console.error('CricAPI search error', err);
      setStatusMessage({ type: 'error', text: 'Failed to search CricAPI. Verify your CricAPI key in appsettings.json.' });
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (item: CricApiPlayerSearchItem) => {
    setImportingId(item.id);
    setStatusMessage(null);
    try {
      await playersApi.importPlayer(item.id);
      setStatusMessage({ type: 'success', text: `Successfully imported ${item.name} with career statistics!` });
      onImportSuccess();
    } catch (err: unknown) {
      console.error('Player import failed', err);
      setStatusMessage({ type: 'error', text: `Failed to import ${item.name}. Player may already exist or stats unavailable.` });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Import from CricAPI</h2>
              <p className="text-xs text-slate-400">Search and import global cricketers and full stats into local database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search global player (e.g. Kohli, Cummins, Rashid Khan, Maxwell)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {statusMessage && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Matching Players ({results.length})
              </p>
              {results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{item.name}</h4>
                    <p className="text-xs text-slate-400">{item.country || 'International'}</p>
                  </div>
                  <button
                    onClick={() => handleImport(item)}
                    disabled={importingId === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {importingId === item.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Import to DB</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              {searching
                ? 'Searching CricAPI database...'
                : 'Type a player\'s name above to query the CricAPI database.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

