import React, { useState } from 'react';
import { Award, Download, TrendingUp, Users, Sparkles, Filter } from 'lucide-react';
import { Tournament } from '../../types/tournament';

interface StandingsTabProps {
  tournament: Tournament;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ tournament }) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'speakers' | 'motions'>('teams');
  const [filterNoviceOnly, setFilterNoviceOnly] = useState<boolean>(false);

  // Calculate Team Standings
  const sortedTeams = [...tournament.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.totalSpeakerScore - a.totalSpeakerScore;
  });

  // Calculate Speaker Standings from all completed ballots
  interface SpeakerStat {
    id: string;
    name: string;
    teamName: string;
    institution: string;
    isNovice: boolean;
    scores: number[];
    totalScore: number;
    averageScore: number;
  }

  const speakerStatsMap = new Map<string, SpeakerStat>();

  // Initialize from team rosters
  tournament.teams.forEach(t => {
    t.speakers.forEach(sp => {
      speakerStatsMap.set(sp.id, {
        id: sp.id,
        name: sp.name,
        teamName: t.name,
        institution: t.institution,
        isNovice: !!sp.isNovice,
        scores: [],
        totalScore: 0,
        averageScore: 0,
      });
    });
  });

  // Extract recorded scores from all rounds
  tournament.rounds.forEach(r => {
    r.pairings.forEach(p => {
      if (!p.ballotSubmitted || !p.wsdcBallot) return;
      const allScores = [...p.wsdcBallot.govSpeakerScores, ...p.wsdcBallot.oppSpeakerScores];
      allScores.forEach(item => {
        const entry = speakerStatsMap.get(item.speakerId);
        if (entry) {
          entry.scores.push(item.score);
          entry.totalScore += item.score;
        }
      });
    });
  });

  // Finalize averages
  const speakerStatsList: SpeakerStat[] = Array.from(speakerStatsMap.values())
    .map(sp => ({
      ...sp,
      averageScore: sp.scores.length > 0 ? sp.totalScore / sp.scores.length : 0,
    }))
    .filter(sp => (filterNoviceOnly ? sp.isNovice : true))
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      return b.totalScore - a.totalScore;
    });

  // Motion Balance Calculation
  const motionStats = tournament.motions.map(m => {
    const roundObj = tournament.rounds.find(r => r.number === m.roundNumber);
    let govWins = 0;
    let oppWins = 0;
    if (roundObj) {
      roundObj.pairings.forEach(p => {
        if (p.ballotSubmitted && p.wsdcBallot) {
          if (p.wsdcBallot.winner === 'Gov') govWins++;
          else oppWins++;
        }
      });
    }
    const total = govWins + oppWins;
    const govPct = total > 0 ? Math.round((govWins / total) * 100) : 50;
    const oppPct = total > 0 ? Math.round((oppWins / total) * 100) : 50;
    return {
      ...m,
      govWins,
      oppWins,
      govPct,
      oppPct,
      totalDebates: total,
    };
  });

  const exportCSV = () => {
    let csvContent = '';
    if (activeTab === 'teams') {
      csvContent = 'Rank,Team,Institution,Wins/Points,Total Speaker Score\n';
      sortedTeams.forEach((t, idx) => {
        csvContent += `${idx + 1},"${t.name}","${t.institution}",${t.points},${t.totalSpeakerScore.toFixed(1)}\n`;
      });
    } else {
      csvContent = 'Rank,Speaker,Team,Institution,Novice,Speeches,Average Score,Total Score\n';
      speakerStatsList.forEach((s, idx) => {
        csvContent += `${idx + 1},"${s.name}","${s.teamName}","${s.institution}",${s.isNovice ? 'Yes' : 'No'},${s.scores.length},${s.averageScore.toFixed(2)},${s.totalScore.toFixed(1)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tournament.name.replace(/\s+/g, '_')}_${activeTab}_tab.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  return (
    <div className={`space-y-6 ${isProjectorMode ? 'fixed inset-0 z-50 bg-slate-950 p-8 overflow-y-auto' : ''}`}>
      {/* Sub-Tabs & Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'teams' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Team Standings
          </button>
          <button
            onClick={() => setActiveTab('speakers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'speakers' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Speaker Tab
          </button>
          <button
            onClick={() => setActiveTab('motions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'motions' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Motion Statistics
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              isProjectorMode
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Full-screen high-contrast display for auditorium projectors"
          >
            {isProjectorMode ? 'Exit Projector Mode' : 'Auditorium Projector View'}
          </button>

          {activeTab === 'speakers' && (
            <button
              onClick={() => setFilterNoviceOnly(!filterNoviceOnly)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                filterNoviceOnly
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {filterNoviceOnly ? 'Novice Filter: Active' : 'Filter Novice'}
            </button>
          )}

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Tab (CSV)
          </button>
        </div>
      </div>

      {/* TEAM STANDINGS VIEW */}
      {activeTab === 'teams' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Championship Team Tab
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Top 4 Teams Qualify for Elimination Break
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4 text-right">Wins / Points</th>
                  <th className="py-3 px-4 text-right">Total Spkr Pts</th>
                  <th className="py-3 px-4 text-right">Avg / Round</th>
                  <th className="py-3 px-4 text-center">Break Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {sortedTeams.map((team, idx) => {
                  const isBreakZone = idx < 4;
                  const completedRounds = tournament.rounds.filter(r => r.isCompleted).length || 1;
                  const avgScore = (team.totalSpeakerScore / completedRounds).toFixed(1);

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBreakZone ? 'bg-indigo-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        {team.name}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        {team.institution}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 tabular-nums">
                        {team.points}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 tabular-nums font-semibold">
                        {team.totalSpeakerScore.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                        {avgScore}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isBreakZone ? (
                          <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                            Break (Rank {idx + 1})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Eliminated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SPEAKER TAB VIEW */}
      {activeTab === 'speakers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Individual Speaker Standings (World Schools 60-80 Scale)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {speakerStatsList.length} Debaters Ranked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Debater</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4 text-center">Category</th>
                  <th className="py-3 px-4 text-right">Speeches</th>
                  <th className="py-3 px-4 text-right">Avg Score</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {speakerStatsList.map((spkr, idx) => (
                  <tr key={spkr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {spkr.name}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {spkr.teamName}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">
                      {spkr.institution}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {spkr.isNovice ? (
                        <span className="text-[10px] text-amber-400 font-medium">Novice</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Open</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {spkr.scores.length}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-400 tabular-nums">
                      {spkr.averageScore > 0 ? spkr.averageScore.toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200 tabular-nums">
                      {spkr.totalScore > 0 ? spkr.totalScore.toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOTION STATISTICS VIEW */}
      {activeTab === 'motions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">
              Motion Balance & Side Bias Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tracks Proposition vs Opposition win rates across all completed rooms to identify motion balance.
            </p>
          </div>

          <div className="space-y-4">
            {motionStats.map(m => (
              <div key={m.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-indigo-400 font-semibold">
                    Round {m.roundNumber} · {m.category}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {m.totalDebates} Debates Logged
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-3">"{m.motionText}"</h4>

                {/* Balance Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold">
                      Gov Wins: {m.govWins} ({m.govPct}%)
                    </span>
                    <span className="text-rose-400 font-semibold">
                      Opp Wins: {m.oppWins} ({m.oppPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${m.govPct}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${m.oppPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
