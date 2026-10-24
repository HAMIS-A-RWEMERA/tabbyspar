import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { Pairing, Team, Tournament, WSDCBallot, BPBallot } from '../../types/tournament';

interface BallotModalProps {
  pairing: Pairing;
  tournament: Tournament;
  onSaveBallot: (updatedPairing: Pairing) => void;
  onClose: () => void;
}

export const BallotModal: React.FC<BallotModalProps> = ({
  pairing,
  tournament,
  onSaveBallot,
  onClose,
}) => {
  const isBP = tournament.format === 'BP';

  const govTeam = tournament.teams.find(t => t.id === pairing.govTeamId);
  const oppTeam = tournament.teams.find(t => t.id === pairing.oppTeamId);

  // WSDC Initial State
  const initialWsdc = pairing.wsdcBallot || {
    govSpeakerScores: [
      { speakerId: govTeam?.speakers[0]?.id || '1', speakerName: govTeam?.speakers[0]?.name || 'Prop 1', role: 'Prop 1', score: 73 },
      { speakerId: govTeam?.speakers[1]?.id || '2', speakerName: govTeam?.speakers[1]?.name || 'Prop 2', role: 'Prop 2', score: 74 },
      { speakerId: govTeam?.speakers[2]?.id || '3', speakerName: govTeam?.speakers[2]?.name || 'Prop 3', role: 'Prop 3', score: 72 },
    ],
    oppSpeakerScores: [
      { speakerId: oppTeam?.speakers[0]?.id || '4', speakerName: oppTeam?.speakers[0]?.name || 'Opp 1', role: 'Opp 1', score: 73 },
      { speakerId: oppTeam?.speakers[1]?.id || '5', speakerName: oppTeam?.speakers[1]?.name || 'Opp 2', role: 'Opp 2', score: 73 },
      { speakerId: oppTeam?.speakers[2]?.id || '6', speakerName: oppTeam?.speakers[2]?.name || 'Opp 3', role: 'Opp 3', score: 71 },
    ],
    govReplyScore: 36,
    oppReplyScore: 35.5,
    govTotal: 255,
    oppTotal: 252.5,
    winner: 'Gov',
    adjudicatorNotes: '',
  };

  const [wsdcBallot, setWsdcBallot] = useState<WSDCBallot>(initialWsdc);

  // BP Initial State
  const initialBP = pairing.bpBallot || {
    ranks: { og: 1, oo: 2, cg: 3, co: 4 },
    speakerScores: {},
    adjudicatorNotes: '',
  };
  const [bpBallot, setBpBallot] = useState<BPBallot>(initialBP);

  // Recalculate WSDC totals
  const handleWsdcScoreChange = (
    side: 'Gov' | 'Opp',
    index: number,
    value: number
  ) => {
    if (side === 'Gov') {
      const updated = [...wsdcBallot.govSpeakerScores];
      updated[index].score = value;
      const govSubTotal = updated.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
      const govTotal = govSubTotal + (Number(wsdcBallot.govReplyScore) || 0);
      setWsdcBallot({
        ...wsdcBallot,
        govSpeakerScores: updated,
        govTotal,
        winner: govTotal >= wsdcBallot.oppTotal ? 'Gov' : 'Opp',
      });
    } else {
      const updated = [...wsdcBallot.oppSpeakerScores];
      updated[index].score = value;
      const oppSubTotal = updated.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
      const oppTotal = oppSubTotal + (Number(wsdcBallot.oppReplyScore) || 0);
      setWsdcBallot({
        ...wsdcBallot,
        oppSpeakerScores: updated,
        oppTotal,
        winner: wsdcBallot.govTotal >= oppTotal ? 'Gov' : 'Opp',
      });
    }
  };

  const handleReplyScoreChange = (side: 'Gov' | 'Opp', val: number) => {
    if (side === 'Gov') {
      const govSubTotal = wsdcBallot.govSpeakerScores.reduce((acc, curr) => acc + curr.score, 0);
      const govTotal = govSubTotal + val;
      setWsdcBallot({
        ...wsdcBallot,
        govReplyScore: val,
        govTotal,
        winner: govTotal >= wsdcBallot.oppTotal ? 'Gov' : 'Opp',
      });
    } else {
      const oppSubTotal = wsdcBallot.oppSpeakerScores.reduce((acc, curr) => acc + curr.score, 0);
      const oppTotal = oppSubTotal + val;
      setWsdcBallot({
        ...wsdcBallot,
        oppReplyScore: val,
        oppTotal,
        winner: wsdcBallot.govTotal >= oppTotal ? 'Gov' : 'Opp',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBP) {
      onSaveBallot({
        ...pairing,
        ballotSubmitted: true,
        bpBallot,
      });
    } else {
      onSaveBallot({
        ...pairing,
        ballotSubmitted: true,
        wsdcBallot,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Official Adjudicator Ballot
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {pairing.roomName} · Round {pairing.roundNumber} ({tournament.format} Format)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isBP ? (
            // WSDC Ballot Form
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Government Side */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Proposition (Gov)
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[180px]">
                      {govTeam?.name || 'Gov Team'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {wsdcBallot.govSpeakerScores.map((sp, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400 font-medium w-16">{sp.role}</span>
                        <span className="text-xs text-slate-300 truncate flex-1">{sp.speakerName}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="60"
                            max="80"
                            step="0.5"
                            value={sp.score}
                            onChange={(e) => handleWsdcScoreChange('Gov', idx, parseFloat(e.target.value) || 60)}
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-right text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">/ 80</span>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400 font-medium w-16">Reply</span>
                      <span className="text-xs text-slate-400 italic flex-1">Gov Reply Speech</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="30"
                          max="40"
                          step="0.5"
                          value={wsdcBallot.govReplyScore}
                          onChange={(e) => handleReplyScoreChange('Gov', parseFloat(e.target.value) || 30)}
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-right text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[10px] text-slate-500">/ 40</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-xs font-semibold text-slate-300">Gov Total Score:</span>
                      <span className="text-base font-bold text-white font-mono tabular-nums">
                        {wsdcBallot.govTotal.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Opposition Side */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                      Opposition (Opp)
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[180px]">
                      {oppTeam?.name || 'Opp Team'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {wsdcBallot.oppSpeakerScores.map((sp, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400 font-medium w-16">{sp.role}</span>
                        <span className="text-xs text-slate-300 truncate flex-1">{sp.speakerName}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="60"
                            max="80"
                            step="0.5"
                            value={sp.score}
                            onChange={(e) => handleWsdcScoreChange('Opp', idx, parseFloat(e.target.value) || 60)}
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-right text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">/ 80</span>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400 font-medium w-16">Reply</span>
                      <span className="text-xs text-slate-400 italic flex-1">Opp Reply Speech</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="30"
                          max="40"
                          step="0.5"
                          value={wsdcBallot.oppReplyScore}
                          onChange={(e) => handleReplyScoreChange('Opp', parseFloat(e.target.value) || 30)}
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-right text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[10px] text-slate-500">/ 40</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-xs font-semibold text-slate-300">Opp Total Score:</span>
                      <span className="text-base font-bold text-white font-mono tabular-nums">
                        {wsdcBallot.oppTotal.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outcome summary bar */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">
                    Awarded Victory to:{' '}
                    <span className={wsdcBallot.winner === 'Gov' ? 'text-emerald-400' : 'text-rose-400'}>
                      {wsdcBallot.winner === 'Gov' ? govTeam?.name : oppTeam?.name} ({wsdcBallot.winner})
                    </span>
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Score Margin: {Math.abs(wsdcBallot.govTotal - wsdcBallot.oppTotal).toFixed(1)} pts
                </span>
              </div>
            </div>
          ) : (
            // BP Ballot Form
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Rank each team 1st (3 pts), 2nd (2 pts), 3rd (1 pt), or 4th (0 pts). All 4 ranks must be unique.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['og', 'oo', 'cg', 'co'] as const).map((pos) => {
                  const teamId = pairing.bpTeamIds?.[pos];
                  const tObj = tournament.teams.find(t => t.id === teamId);
                  return (
                    <div key={pos} className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                      <span className="text-xs font-bold uppercase text-indigo-400 block mb-1">
                        {pos.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-white block truncate mb-2">
                        {tObj?.name || pos}
                      </span>
                      <label className="text-[10px] text-slate-400 block mb-1">Assigned Rank:</label>
                      <select
                        value={bpBallot.ranks[pos]}
                        onChange={(e) =>
                          setBpBallot({
                            ...bpBallot,
                            ranks: {
                              ...bpBallot.ranks,
                              [pos]: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 font-mono"
                      >
                        <option value={1}>1st Place (3 pts)</option>
                        <option value={2}>2nd Place (2 pts)</option>
                        <option value={3}>3rd Place (1 pt)</option>
                        <option value={4}>4th Place (0 pts)</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adjudicator Reasoning notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Adjudicator Notes / Reason for Decision (RFD Summary)
            </label>
            <textarea
              rows={3}
              value={isBP ? bpBallot.adjudicatorNotes : wsdcBallot.adjudicatorNotes}
              onChange={(e) => {
                if (isBP) {
                  setBpBallot({ ...bpBallot, adjudicatorNotes: e.target.value });
                } else {
                  setWsdcBallot({ ...wsdcBallot, adjudicatorNotes: e.target.value });
                }
              }}
              placeholder="Explain how the key clashes were weighed and why the comparative favored the winning side..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Confirm & Save Ballot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
