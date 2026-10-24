import React from 'react';
import { Gavel, Award, Users, Swords, BookOpen, Cloud, Download } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'pairings' | 'standings' | 'teams' | 'spar' | 'guide' | 'ballot-mobile';
  onSelectView: (view: 'dashboard' | 'pairings' | 'standings' | 'teams' | 'spar' | 'guide' | 'ballot-mobile') => void;
  tournamentName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView, tournamentName }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectView('dashboard')}
          className="flex items-center gap-2.5 text-left group shrink-0 focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">
              TabbySpar
            </span>
            <span className="text-[10px] text-slate-400 font-mono block tracking-wider uppercase mt-1">
              Zero-Cost Debate Tab & Spar
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single-line, whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'dashboard'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Tournament Tab
          </button>

          <button
            onClick={() => onSelectView('pairings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'pairings'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            Rounds & Pairings
          </button>

          <button
            onClick={() => onSelectView('standings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'standings'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Standings & Tabs
          </button>

          <button
            onClick={() => onSelectView('teams')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'teams'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Teams & Judges
          </button>

          <button
            onClick={() => onSelectView('ballot-mobile')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'ballot-mobile'
                ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
            title="Adjudicator mobile ballot portal with PIN check-in"
          >
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            Live Mobile Ballot
          </button>

          <button
            onClick={() => onSelectView('spar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'spar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            AI Debate Spar Zone
          </button>

          <button
            onClick={() => onSelectView('guide')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'guide'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Azure Guide
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectView('spar')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm"
          >
            <Swords className="w-3.5 h-3.5" />
            Start Impromptu Spar
          </button>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 bg-slate-900 border-t border-slate-800 overflow-x-auto">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Tab
        </button>
        <button
          onClick={() => onSelectView('pairings')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentView === 'pairings' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Pairings
        </button>
        <button
          onClick={() => onSelectView('standings')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentView === 'standings' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Standings
        </button>
        <button
          onClick={() => onSelectView('spar')}
          className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${currentView === 'spar' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
        >
          Spar Zone
        </button>
        <button
          onClick={() => onSelectView('guide')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentView === 'guide' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Azure Guide
        </button>
      </div>
    </header>
  );
};
