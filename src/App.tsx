import React, { useState, useEffect } from 'react';
import { Tournament } from './types/tournament';
import { sampleWSDCTournament } from './data/sampleTournaments';
import { Navbar } from './components/Navbar';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';
import { PairingsView } from './components/tournament/PairingsView';
import { StandingsTab } from './components/tournament/StandingsTab';
import { TeamsAdjudicatorsView } from './components/tournament/TeamsAdjudicatorsView';
import { SparZone } from './components/spar/SparZone';
import { HostingGuide } from './components/guide/HostingGuide';
import { PrepTimerModal } from './components/tournament/PrepTimerModal';
import { LiveBallotMobileView } from './components/tournament/LiveBallotMobileView';

const LOCAL_STORAGE_KEY = 'tabbyspar_tournament_data_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'pairings' | 'standings' | 'teams' | 'spar' | 'guide' | 'ballot-mobile'
  >('dashboard');

  // Load tournament from local storage or sample default
  const [tournament, setTournament] = useState<Tournament>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved tournament, falling back to sample', e);
    }
    return sampleWSDCTournament;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tournament));
    } catch (e) {
      console.warn('Failed to save tournament to localStorage', e);
    }
  }, [tournament]);

  // Prep timer modal state
  const [prepModalData, setPrepModalData] = useState<{
    isOpen: boolean;
    minutes: number;
    motionText: string;
  }>({
    isOpen: false,
    minutes: 15,
    motionText: '',
  });

  const handleStartPrepTimer = (minutes: number, motionText: string) => {
    setPrepModalData({
      isOpen: true,
      minutes,
      motionText,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        tournamentName={tournament.name}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <TournamentDashboard
            tournament={tournament}
            onUpdateTournament={setTournament}
            onNavigate={setCurrentView}
            onStartPrepTimer={handleStartPrepTimer}
          />
        )}

        {currentView === 'pairings' && (
          <PairingsView
            tournament={tournament}
            onUpdateTournament={setTournament}
            onStartPrepTimer={handleStartPrepTimer}
            onOpenMobilePortal={() => setCurrentView('ballot-mobile')}
          />
        )}

        {currentView === 'standings' && (
          <StandingsTab tournament={tournament} />
        )}

        {currentView === 'teams' && (
          <TeamsAdjudicatorsView
            tournament={tournament}
            onUpdateTournament={setTournament}
          />
        )}

        {currentView === 'spar' && (
          <SparZone />
        )}

        {currentView === 'ballot-mobile' && (
          <LiveBallotMobileView
            onBackToTab={() => setCurrentView('pairings')}
          />
        )}

        {currentView === 'guide' && (
          <HostingGuide />
        )}
      </main>

      {/* Prep Timer Countdown Modal */}
      {prepModalData.isOpen && (
        <PrepTimerModal
          initialMinutes={prepModalData.minutes}
          motionText={prepModalData.motionText}
          onClose={() => setPrepModalData(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>TabbySpar · 100% Free Open Debate Tabulator & Spar Zone</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('guide')}
              className="text-slate-400 hover:text-indigo-400 underline transition-colors"
            >
              Free Azure & Vercel Deployment Guide
            </button>
            <span>·</span>
            <span>WSDC & BP Adjudication Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
