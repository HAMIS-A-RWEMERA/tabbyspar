import React, { useState } from 'react';
import {
  Gavel,
  Award,
  Users,
  Swords,
  Download,
  Upload,
  Plus,
  Play,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Database,
  Check,
} from 'lucide-react';
import { Tournament, DebateFormat } from '../../types/tournament';
import { sampleWSDCTournament } from '../../data/sampleTournaments';

interface TournamentDashboardProps {
  tournament: Tournament;
  onUpdateTournament: (updated: Tournament) => void;
  onNavigate: (view: 'pairings' | 'standings' | 'teams' | 'spar' | 'guide') => void;
  onStartPrepTimer: (minutes: number, motionText: string) => void;
}

export const TournamentDashboard: React.FC<TournamentDashboardProps> = ({
  tournament,
  onUpdateTournament,
  onNavigate,
  onStartPrepTimer,
}) => {
  const [showNewTournamentModal, setShowNewTournamentModal] = useState(false);
  const [newTournName, setNewTournName] = useState('');
  const [newTournFormat, setNewTournFormat] = useState<DebateFormat>('WSDC');
  const [newTournRounds, setNewTournRounds] = useState(5);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState('');

  const completedRounds = tournament.rounds.filter(r => r.isCompleted).length;
  const currentMotion = tournament.motions.find(m => m.roundNumber === tournament.currentRound);

  const handleSyncToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncMsg('');
    try {
      const res = await fetch('/api/tournaments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament,
          ownerUid: 'debate-director',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudSyncMsg('Tournament synchronized to Cloud SQL (PostgreSQL)!');
      } else {
        setCloudSyncMsg('Failed to sync to database');
      }
    } catch (e) {
      setCloudSyncMsg('Error syncing to database');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tournament, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${tournament.name.replace(/\s+/g, '_')}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.name && parsed.teams && parsed.rounds) {
          onUpdateTournament(parsed);
          alert('Tournament loaded successfully!');
        } else {
          alert('Invalid tournament JSON format.');
        }
      } catch (err) {
        alert('Could not parse tournament JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournName.trim()) return;

    const blank: Tournament = {
      id: `tourn-${Date.now()}`,
      name: newTournName,
      format: newTournFormat,
      currentRound: 1,
      totalRounds: newTournRounds,
      prepTimeMinutes: 15,
      teams: [],
      adjudicators: [],
      motions: [
        {
          id: 'm-1',
          roundNumber: 1,
          motionText: 'This House would establish mandatory universal basic income.',
          category: 'Economics',
          isReleased: true,
        },
      ],
      rounds: [
        {
          id: 'round-1',
          number: 1,
          name: 'Round 1: Preliminary',
          isCompleted: false,
          isSilent: false,
          pairings: [],
        },
      ],
    };

    onUpdateTournament(blank);
    setShowNewTournamentModal(false);
    setNewTournName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Tournament Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-indigo-950 border border-indigo-500/30 text-indigo-300 rounded">
              {tournament.format} Debate Format
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Round {tournament.currentRound} of {tournament.totalRounds}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {tournament.name}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            100% Free client-side debate tabulator. Generates Swiss-system power pairings, tracks speaker points, and produces WSDC / BP championship tabs with zero server cost.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('pairings')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Gavel className="w-3.5 h-3.5" />
            Manage Round {tournament.currentRound}
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Download tournament file for backup or sharing"
          >
            <Download className="w-3.5 h-3.5" />
            Export (.json)
          </button>

          <label className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => onUpdateTournament(sampleWSDCTournament)}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
            title="Reset to pre-loaded sample tournament"
          >
            Load Sample WSDC
          </button>

          <button
            onClick={handleSyncToCloud}
            disabled={isCloudSyncing}
            className="px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Persist tournament state to Cloud SQL PostgreSQL database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            {isCloudSyncing ? 'Syncing...' : 'Sync to Cloud SQL'}
          </button>

          <button
            onClick={() => setShowNewTournamentModal(true)}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Tournament
          </button>
        </div>
      </div>

      {cloudSyncMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudSyncMsg}</span>
          </div>
          <button
            onClick={() => setCloudSyncMsg('')}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Teams */}
        <div
          onClick={() => onNavigate('teams')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Registered Teams</span>
            <Users className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-2xl font-mono font-bold text-white tabular-nums">
            {tournament.teams.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {tournament.teams.reduce((acc, t) => acc + t.speakers.length, 0)} Debaters
          </span>
        </div>

        {/* Adjudicators */}
        <div
          onClick={() => onNavigate('teams')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Adjudicator Pool</span>
            <ShieldAlert className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-2xl font-mono font-bold text-white tabular-nums">
            {tournament.adjudicators.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {tournament.adjudicators.filter(a => a.isChair).length} Chair Accredited
          </span>
        </div>

        {/* Rounds Completed */}
        <div
          onClick={() => onNavigate('pairings')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Rounds Completed</span>
            <Clock className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-2xl font-mono font-bold text-white tabular-nums">
            {completedRounds} / {tournament.totalRounds}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1 font-mono">
            {tournament.rounds[tournament.currentRound - 1]?.isCompleted
              ? 'Round Completed'
              : 'Round in Progress'}
          </span>
        </div>

        {/* Spar Zone Gateway */}
        <div
          onClick={() => onNavigate('spar')}
          className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-xl p-4 hover:border-indigo-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-indigo-300 mb-2">
            <span className="text-xs font-bold">AI Spar Zone</span>
            <Swords className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-sm font-bold text-white block">
            Practice & Spar
          </span>
          <span className="text-[11px] text-indigo-300/80 block mt-1">
            AI Opponent & Judge →
          </span>
        </div>
      </div>

      {/* Current Round Motion & Quick Pairings View */}
      {currentMotion && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Current Round Motion · Round {tournament.currentRound} ({currentMotion.category})
            </span>
            <button
              onClick={() => onStartPrepTimer(tournament.prepTimeMinutes, currentMotion.motionText)}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              Launch {tournament.prepTimeMinutes}m Prep Countdown
            </button>
          </div>
          <h3 className="text-lg font-bold text-white">"{currentMotion.motionText}"</h3>
          {currentMotion.infoSlide && (
            <p className="text-xs text-slate-400 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              {currentMotion.infoSlide}
            </p>
          )}
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('pairings')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3">
              <Gavel className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Swiss Round Pairings</h4>
            <p className="text-xs text-slate-400 mt-1">
              View chambers, assigned chairs, power-matched matchups, and submit official adjudicator ballots.
            </p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-4">
            Open Pairings <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('standings')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Championship Standings</h4>
            <p className="text-xs text-slate-400 mt-1">
              Examine live team ranks, speaker averages, novice tabs, and motion balance win rates.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-4">
            View Tabs <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('guide')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Free Azure Hosting Guide</h4>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step instructions for hosting your own free instance on Microsoft Azure Static Web Apps.
            </p>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-4">
            Read Guide <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* NEW TOURNAMENT MODAL */}
      {showNewTournamentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Debate Tournament</h3>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tournament Name</label>
                <input
                  type="text"
                  required
                  value={newTournName}
                  onChange={e => setNewTournName(e.target.value)}
                  placeholder="e.g. National Schools Debate Championship 2026"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Debate Format</label>
                <select
                  value={newTournFormat}
                  onChange={e => setNewTournFormat(e.target.value as DebateFormat)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="WSDC">World Schools Debating Championship (WSDC - 3v3)</option>
                  <option value="BP">British Parliamentary (BP - 4 teams)</option>
                  <option value="AP">Asian Parliamentary (AP - 3v3)</option>
                  <option value="SPAR_1V1">1v1 Impromptu Spar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Total Preliminary Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newTournRounds}
                  onChange={e => setNewTournRounds(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTournamentModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
