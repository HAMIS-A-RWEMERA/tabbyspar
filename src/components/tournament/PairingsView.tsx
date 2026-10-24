import React, { useState, useEffect } from 'react';
import { Gavel, CheckCircle2, Clock, Play, Plus, RefreshCw, FileText, ChevronRight, Cloud, Smartphone, Key } from 'lucide-react';
import { Tournament, Pairing, Round } from '../../types/tournament';
import { BallotModal } from './BallotModal';
import { generateSwissPairings } from '../../services/swissPairing';

interface PairingsViewProps {
  tournament: Tournament;
  onUpdateTournament: (updated: Tournament) => void;
  onStartPrepTimer: (minutes: number, motionText: string) => void;
  onOpenMobilePortal?: () => void;
}

export const PairingsView: React.FC<PairingsViewProps> = ({
  tournament,
  onUpdateTournament,
  onStartPrepTimer,
  onOpenMobilePortal,
}) => {
  const [selectedRoundNum, setSelectedRoundNum] = useState<number>(tournament.currentRound);
  const [activeBallotPairing, setActiveBallotPairing] = useState<Pairing | null>(null);
  const [isPublishingCloud, setIsPublishingCloud] = useState<boolean>(false);
  const [cloudPublishedRooms, setCloudPublishedRooms] = useState<Record<string, string>>({}); // roomId -> PIN
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string>('');

  const currentRoundObj = tournament.rounds.find(r => r.number === selectedRoundNum) || tournament.rounds[0];
  const motionObj = tournament.motions.find(m => m.roundNumber === selectedRoundNum);

  const handleSaveBallot = (updatedPairing: Pairing) => {
    // 1. Update the pairing inside the round
    const updatedRounds = tournament.rounds.map(r => {
      if (r.number !== selectedRoundNum) return r;
      const updatedPairings = r.pairings.map(p => (p.id === updatedPairing.id ? updatedPairing : p));
      const allSubmitted = updatedPairings.every(p => p.ballotSubmitted);
      return {
        ...r,
        pairings: updatedPairings,
        isCompleted: allSubmitted,
      };
    });

    // 2. Recalculate team points and speaker scores
    const teamStatsMap = new Map<string, { wins: number; totalScore: number }>();
    tournament.teams.forEach(t => teamStatsMap.set(t.id, { wins: 0, totalScore: 0 }));

    // Accumulate across all rounds with submitted ballots
    updatedRounds.forEach(r => {
      r.pairings.forEach(p => {
        if (!p.ballotSubmitted) return;

        if (p.wsdcBallot && p.govTeamId && p.oppTeamId) {
          const govStats = teamStatsMap.get(p.govTeamId) || { wins: 0, totalScore: 0 };
          const oppStats = teamStatsMap.get(p.oppTeamId) || { wins: 0, totalScore: 0 };

          govStats.totalScore += p.wsdcBallot.govTotal;
          oppStats.totalScore += p.wsdcBallot.oppTotal;

          if (p.wsdcBallot.winner === 'Gov') {
            govStats.wins += 1;
          } else {
            oppStats.wins += 1;
          }

          teamStatsMap.set(p.govTeamId, govStats);
          teamStatsMap.set(p.oppTeamId, oppStats);
        } else if (p.bpBallot && p.bpTeamIds) {
          const ranks = p.bpBallot.ranks;
          const posToPts: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0 };
          
          if (p.bpTeamIds.og) {
            const s = teamStatsMap.get(p.bpTeamIds.og) || { wins: 0, totalScore: 0 };
            s.wins += posToPts[ranks.og] || 0;
            teamStatsMap.set(p.bpTeamIds.og, s);
          }
          if (p.bpTeamIds.oo) {
            const s = teamStatsMap.get(p.bpTeamIds.oo) || { wins: 0, totalScore: 0 };
            s.wins += posToPts[ranks.oo] || 0;
            teamStatsMap.set(p.bpTeamIds.oo, s);
          }
          if (p.bpTeamIds.cg) {
            const s = teamStatsMap.get(p.bpTeamIds.cg) || { wins: 0, totalScore: 0 };
            s.wins += posToPts[ranks.cg] || 0;
            teamStatsMap.set(p.bpTeamIds.cg, s);
          }
          if (p.bpTeamIds.co) {
            const s = teamStatsMap.get(p.bpTeamIds.co) || { wins: 0, totalScore: 0 };
            s.wins += posToPts[ranks.co] || 0;
            teamStatsMap.set(p.bpTeamIds.co, s);
          }
        }
      });
    });

    const updatedTeams = tournament.teams.map(t => {
      const stats = teamStatsMap.get(t.id) || { wins: 0, totalScore: 0 };
      return {
        ...t,
        points: stats.wins,
        totalSpeakerScore: stats.totalScore,
      };
    });

    onUpdateTournament({
      ...tournament,
      rounds: updatedRounds,
      teams: updatedTeams,
    });

    setActiveBallotPairing(null);
  };

  const handleGenerateNextRound = () => {
    const nextRoundNumber = tournament.rounds.length + 1;
    const newPairings = generateSwissPairings(
      nextRoundNumber,
      tournament.format,
      tournament.teams,
      tournament.adjudicators,
      tournament.rounds
    );

    const newRound: Round = {
      id: `round-${nextRoundNumber}`,
      number: nextRoundNumber,
      name: `Round ${nextRoundNumber}: Swiss Power-Paired`,
      isCompleted: false,
      isSilent: false,
      pairings: newPairings,
    };

    onUpdateTournament({
      ...tournament,
      currentRound: nextRoundNumber,
      rounds: [...tournament.rounds, newRound],
    });

    setSelectedRoundNum(nextRoundNumber);
  };

  // Publish round pairings to Cloud SQL and generate room PINs
  const handlePublishCloud = async () => {
    if (!currentRoundObj) return;
    setIsPublishingCloud(true);
    setCloudStatusMessage('');

    try {
      const res = await fetch('/api/live-ballots/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          roundNumber: selectedRoundNum,
          pairings: currentRoundObj.pairings,
          teams: tournament.teams,
          adjudicators: tournament.adjudicators,
        }),
      });
      const data = await res.json();
      if (data.success && data.ballots) {
        const pinMap: Record<string, string> = {};
        data.ballots.forEach((b: any) => {
          pinMap[b.roomName] = b.pin;
        });
        setCloudPublishedRooms(pinMap);
        setCloudStatusMessage(`Round ${selectedRoundNum} published to PostgreSQL with room PINs!`);
      }
    } catch (err) {
      console.error('Failed to publish round:', err);
      setCloudStatusMessage('Cloud publish error');
    } finally {
      setIsPublishingCloud(false);
    }
  };

  // Live polling for submitted ballots from judges' phones
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live-ballots/${tournament.id}/${selectedRoundNum}`);
        const data = await res.json();
        if (data.success && data.ballots) {
          // Check if any ballot was submitted from phone
          let hasUpdates = false;
          const updatedPairings = currentRoundObj.pairings.map(p => {
            const match = data.ballots.find((b: any) => b.roomName === p.roomName);
            if (match && match.isSubmitted && !p.ballotSubmitted && match.ballotPayload) {
              hasUpdates = true;
              return {
                ...p,
                ballotSubmitted: true,
                wsdcBallot: JSON.parse(match.ballotPayload),
              };
            }
            return p;
          });

          if (hasUpdates) {
            const updatedRounds = tournament.rounds.map(r =>
              r.number === selectedRoundNum ? { ...r, pairings: updatedPairings } : r
            );
            onUpdateTournament({ ...tournament, rounds: updatedRounds });
          }
        }
      } catch (e) {
        // quiet error
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [tournament, selectedRoundNum, currentRoundObj]);

  return (
    <div className="space-y-6">
      {/* Top Round Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {tournament.rounds.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundNum(r.number)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                selectedRoundNum === r.number
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Round {r.number}</span>
              {r.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Publish to Cloud Button */}
          <button
            onClick={handlePublishCloud}
            disabled={isPublishingCloud}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 hover:bg-emerald-900/60 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Publish room PINs to PostgreSQL for live phone ballots"
          >
            <Cloud className="w-3.5 h-3.5" />
            {isPublishingCloud ? 'Publishing...' : 'Publish to Cloud SQL (PINs)'}
          </button>

          {/* Mobile Judge Portal Button */}
          {onOpenMobilePortal && (
            <button
              onClick={onOpenMobilePortal}
              className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 border border-amber-500/30 hover:bg-amber-900/60 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Open Mobile Ballot Submission Portal"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Judge Portal
            </button>
          )}

          <button
            onClick={handleGenerateNextRound}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 hover:bg-indigo-900/60 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Next Swiss Round
          </button>
        </div>
      </div>

      {cloudStatusMessage && (
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {cloudStatusMessage}
        </div>
      )}

      {/* Round Motion Card */}
      {motionObj && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
              Motion · Round {selectedRoundNum} ({motionObj.category})
            </span>
            <button
              onClick={() => onStartPrepTimer(tournament.prepTimeMinutes, motionObj.motionText)}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              Start {tournament.prepTimeMinutes}m Prep Clock
            </button>
          </div>
          <h3 className="text-base md:text-lg font-bold text-white leading-snug">
            "{motionObj.motionText}"
          </h3>
          {motionObj.infoSlide && (
            <p className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              {motionObj.infoSlide}
            </p>
          )}
        </div>
      )}

      {/* Pairings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {currentRoundObj?.name || `Round ${selectedRoundNum}`} Pairings & Adjudications
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {currentRoundObj?.pairings.length || 0} Rooms Allocated
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {currentRoundObj?.pairings.map((p, idx) => {
            const govTeam = tournament.teams.find(t => t.id === p.govTeamId);
            const oppTeam = tournament.teams.find(t => t.id === p.oppTeamId);
            const chairJudge = tournament.adjudicators.find(a => a.id === p.chairId);

            return (
              <div
                key={p.id}
                className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Room identifier */}
                <div className="lg:w-36 shrink-0 space-y-1">
                  <span className="text-xs font-mono font-semibold text-slate-400 uppercase block">
                    {p.roomName}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    Match #{idx + 1}
                  </span>
                  {cloudPublishedRooms[p.roomName] && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded">
                      <Key className="w-2.5 h-2.5 text-amber-400" />
                      PIN: {cloudPublishedRooms[p.roomName]}
                    </span>
                  )}
                </div>

                {/* Matchup details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gov */}
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider">
                        Proposition
                      </span>
                      <span className="text-slate-400 font-mono tabular-nums">
                        {govTeam?.points || 0} Wins
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white block truncate">
                      {govTeam?.name || 'Gov Team'}
                    </span>
                    <span className="text-xs text-slate-400 block truncate">
                      {govTeam?.institution}
                    </span>
                  </div>

                  {/* Opp */}
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-rose-400 uppercase text-[10px] tracking-wider">
                        Opposition
                      </span>
                      <span className="text-slate-400 font-mono tabular-nums">
                        {oppTeam?.points || 0} Wins
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white block truncate">
                      {oppTeam?.name || 'Opp Team'}
                    </span>
                    <span className="text-xs text-slate-400 block truncate">
                      {oppTeam?.institution}
                    </span>
                  </div>
                </div>

                {/* Adjudicators */}
                <div className="lg:w-56 shrink-0">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">
                    Adjudicator Panel
                  </span>
                  <span className="text-xs font-semibold text-slate-200 block truncate mt-0.5">
                    {chairJudge?.name || 'Chair Assigned'}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Score: {chairJudge?.score || '7.5'} · {chairJudge?.institution}
                  </span>
                </div>

                {/* Status & Ballot Action */}
                <div className="lg:w-44 shrink-0 flex items-center justify-between lg:justify-end gap-3">
                  {p.ballotSubmitted ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p.wsdcBallot?.winner || 'Decided'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono tabular-nums">
                        {p.wsdcBallot?.govTotal?.toFixed(1)} - {p.wsdcBallot?.oppTotal?.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}

                  <button
                    onClick={() => setActiveBallotPairing(p)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                  >
                    {p.ballotSubmitted ? 'Edit Ballot' : 'Enter Ballot'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ballot Modal */}
      {activeBallotPairing && (
        <BallotModal
          pairing={activeBallotPairing}
          tournament={tournament}
          onSaveBallot={handleSaveBallot}
          onClose={() => setActiveBallotPairing(null)}
        />
      )}
    </div>
  );
};
