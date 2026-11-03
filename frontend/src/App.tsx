import { useState, useEffect, useMemo } from 'react';
import { playersApi } from './api/client';
import type { PlayerResponseDto } from './types/cricket';
import { Navbar } from './components/Navbar';
import { PlayerCard } from './components/PlayerCard';
import { CricApiImportModal } from './components/CricApiImportModal';
import { CreatePlayerModal } from './components/CreatePlayerModal';
import { AIReportView } from './components/AIReportView';
import { HeadToHeadView } from './components/HeadToHeadView';
import {
  Search,
  UserPlus,
  Plus,
  Loader2,
  Users,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function App() {
  const [players, setPlayers] = useState<PlayerResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'roster' | 'compare'>('roster');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedPlayerForScout, setSelectedPlayerForScout] = useState<PlayerResponseDto | null>(null);
  const [preselectedCompareId, setPreselectedCompareId] = useState<number | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playersApi.getPlayers();
      setPlayers(data);
      if (data.length > 0 && !selectedPlayerForScout) {
        setSelectedPlayerForScout(data[0]);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch players', err);
      setError('Unable to connect to the backend API at http://localhost:5118. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await playersApi.seedPlayers();
      await fetchPlayers();
    } catch (err) {
      console.error('Seeding failed', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeletePlayer = async (id: number) => {
    if (!confirm('Are you sure you want to remove this player from your roster?')) return;
    try {
      await playersApi.deletePlayer(id);
      if (selectedPlayerForScout?.id === id) {
        setSelectedPlayerForScout(null);
      }
      await fetchPlayers();
    } catch (err) {
      console.error('Failed to delete player', err);
    }
  };

  const handleCompareSelect = (player: PlayerResponseDto) => {
    setPreselectedCompareId(player.id);
    setActiveTab('compare');
  };

  // Filtered players based on search string and role
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.country.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        selectedRole === 'All' ||
        p.role.toLowerCase().includes(selectedRole.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [players, search, selectedRole]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  const roles = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSeed={handleSeed}
        isSeeding={isSeeding}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner if Backend is offline */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchPlayers}
              className="px-3 py-1 bg-rose-800/60 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab 1: Roster & Scouting Hub */}
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Player Catalog & Search */}
            <div className="lg:col-span-7 space-y-6">
              {/* Toolbar: Search, Role Filter, CricAPI Import Button */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search player or country (e.g. Kohli, Australia)..."
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Action Buttons: Create & Import */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Player</span>
                    </button>
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Import CricAPI</span>
                    </button>
                  </div>
                </div>

                {/* Role Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                        selectedRole === role
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Grid */}
              {loading ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-500 mb-2" />
                  <p className="text-xs">Loading players from database...</p>
                </div>
              ) : filteredPlayers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paginatedPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        onScout={(p) => setSelectedPlayerForScout(p)}
                        onCompareSelect={handleCompareSelect}
                        onDelete={handleDeletePlayer}
                        isAnalyzing={selectedPlayerForScout?.id === player.id}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls (6 per page) */}
                  {filteredPlayers.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl shadow-sm">
                      <p className="text-xs text-slate-400">
                        Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-semibold text-slate-200">
                          {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-200">{filteredPlayers.length}</span> players
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                              currentPage === page
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-300">No Players Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {search || selectedRole !== 'All'
                      ? 'No players matched your filter criteria.'
                      : 'Your database is currently empty. Click "Seed Sample Players" or "Import CricAPI" to get started.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={handleSeed}
                      disabled={isSeeding}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                      {isSeeding ? 'Seeding...' : 'Seed Sample Players'}
                    </button>
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Import from CricAPI
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: AI Tactical Scouting Panel */}
            <div className="lg:col-span-5 sticky top-24">
              <AIReportView player={selectedPlayerForScout} />
            </div>
          </div>
        )}

        {/* Tab 2: Head-to-Head Comparison */}
        {activeTab === 'compare' && (
          <div className="max-w-4xl mx-auto">
            <HeadToHeadView
              players={players}
              initialPlayer1Id={preselectedCompareId}
            />
          </div>
        )}
      </main>

      {/* Create Player Modal */}
      <CreatePlayerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPlayerCreated={fetchPlayers}
      />

      {/* CricAPI Import Modal */}
      <CricApiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchPlayers}
      />
    </div>
  );
}
