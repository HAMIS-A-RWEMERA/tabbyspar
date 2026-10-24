import React, { useState } from 'react';
import { Smartphone, CheckCircle2, Lock, Save, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { WSDCBallot } from '../../types/tournament';

interface LiveBallotMobileViewProps {
  onBackToTab: () => void;
}

export const LiveBallotMobileView: React.FC<LiveBallotMobileViewProps> = ({ onBackToTab }) => {
  const [ballotId, setBallotId] = useState('');
  const [pin, setPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{
    roomName: string;
    govTeamName: string;
    oppTeamName: string;
    roundNumber: number;
  }>({
    roomName: 'Chamber Alpha',
    govTeamName: 'Team Canada Red',
    oppTeamName: 'Team Singapore A',
    roundNumber: 3,
  });

  const [govScores, setGovScores] = useState([74, 75, 73]);
  const [oppScores, setOppScores] = useState([75, 74, 72]);
  const [govReply, setGovReply] = useState(36.5);
  const [oppReply, setOppReply] = useState(36.0);
  const [rfdNotes, setRfdNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const govTotal = govScores.reduce((a, b) => a + b, 0) + govReply;
  const oppTotal = oppScores.reduce((a, b) => a + b, 0) + oppReply;
  const winner = govTotal >= oppTotal ? 'Gov' : 'Opp';

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setErrorMessage('Please enter a valid 4-digit room PIN.');
      return;
    }
    setErrorMessage('');
    setIsPinVerified(true);
  };

  const handleSubmitBallot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const ballotData: WSDCBallot = {
      govSpeakerScores: [
        { speakerId: '1', speakerName: 'Prop 1', role: 'Prop 1', score: govScores[0] },
        { speakerId: '2', speakerName: 'Prop 2', role: 'Prop 2', score: govScores[1] },
        { speakerId: '3', speakerName: 'Prop 3', role: 'Prop 3', score: govScores[2] },
      ],
      oppSpeakerScores: [
        { speakerId: '4', speakerName: 'Opp 1', role: 'Opp 1', score: oppScores[0] },
        { speakerId: '5', speakerName: 'Opp 2', role: 'Opp 2', score: oppScores[1] },
        { speakerId: '6', speakerName: 'Opp 3', role: 'Opp 3', score: oppScores[2] },
      ],
      govReplyScore: govReply,
      oppReplyScore: oppReply,
      govTotal,
      oppTotal,
      winner,
      adjudicatorNotes: rfdNotes,
    };

    try {
      const targetId = ballotId || 'demo-ballot';
      const res = await fetch(`/api/live-ballots/${targetId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          ballotData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ballot');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToTab}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament Desk
        </button>

        <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded flex items-center gap-1">
          <Smartphone className="w-3 h-3" />
          Mobile Adjudicator Portal
        </span>
      </div>

      {!isPinVerified ? (
        /* PIN Entry Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Adjudicator Room Check-in</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your room's 4-digit PIN provided on the pairings board or by the Tab Director.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                4-Digit Room PIN
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-36 text-center tracking-widest text-2xl font-mono px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
            >
              Verify PIN & Open Official Ballot
            </button>
          </form>
        </div>
      ) : isSuccess ? (
        /* Success Screen */
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 space-y-4 shadow-xl text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white">Ballot Submitted to Tab Room!</h3>
          <p className="text-xs text-slate-300">
            Your official adjudication for <strong>{roomInfo.roomName}</strong> has been transmitted to PostgreSQL and verified by the Chief Adjudicator.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono space-y-1">
            <div className="text-emerald-400 font-bold">
              Awarded Win: {winner === 'Gov' ? roomInfo.govTeamName : roomInfo.oppTeamName} ({winner})
            </div>
            <div className="text-slate-400">
              Score: {govTotal.toFixed(1)} - {oppTotal.toFixed(1)} (Margin: {Math.abs(govTotal - oppTotal).toFixed(1)})
            </div>
          </div>

          <button
            onClick={onBackToTab}
            className="w-full py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Return to Tournament Overview
          </button>
        </div>
      ) : (
        /* Official Ballot Submission Form */
        <form onSubmit={handleSubmitBallot} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between text-xs font-mono text-indigo-400 mb-1">
              <span>{roomInfo.roomName}</span>
              <span>Round {roomInfo.roundNumber}</span>
            </div>
            <h3 className="text-base font-bold text-white">Official Ballot Entry</h3>
          </div>

          {/* Proposition */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400">Proposition (Gov)</span>
              <span className="font-semibold text-white truncate max-w-[150px]">{roomInfo.govTeamName}</span>
            </div>

            {[0, 1, 2].map(idx => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Prop Speaker {idx + 1}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="60"
                    max="80"
                    step="0.5"
                    value={govScores[idx]}
                    onChange={e => {
                      const updated = [...govScores];
                      updated[idx] = parseFloat(e.target.value) || 60;
                      setGovScores(updated);
                    }}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">/80</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-mono">Gov Reply Speech</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="30"
                  max="40"
                  step="0.5"
                  value={govReply}
                  onChange={e => setGovReply(parseFloat(e.target.value) || 30)}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-500">/40</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-xs">
              <span className="text-slate-400 font-semibold">Total Gov:</span>
              <span className="font-bold text-white tabular-nums">{govTotal.toFixed(1)}</span>
            </div>
          </div>

          {/* Opposition */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-rose-400">Opposition (Opp)</span>
              <span className="font-semibold text-white truncate max-w-[150px]">{roomInfo.oppTeamName}</span>
            </div>

            {[0, 1, 2].map(idx => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Opp Speaker {idx + 1}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="60"
                    max="80"
                    step="0.5"
                    value={oppScores[idx]}
                    onChange={e => {
                      const updated = [...oppScores];
                      updated[idx] = parseFloat(e.target.value) || 60;
                      setOppScores(updated);
                    }}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">/80</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-mono">Opp Reply Speech</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="30"
                  max="40"
                  step="0.5"
                  value={oppReply}
                  onChange={e => setOppReply(parseFloat(e.target.value) || 30)}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-500">/40</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-xs">
              <span className="text-slate-400 font-semibold">Total Opp:</span>
              <span className="font-bold text-white tabular-nums">{oppTotal.toFixed(1)}</span>
            </div>
          </div>

          {/* Decision Preview */}
          <div className="p-3 bg-slate-950 rounded-xl text-center text-xs font-mono">
            <span className="text-slate-400 block mb-0.5">Calculated Decision:</span>
            <span className={`text-sm font-bold ${winner === 'Gov' ? 'text-emerald-400' : 'text-rose-400'}`}>
              Victory to {winner === 'Gov' ? roomInfo.govTeamName : roomInfo.oppTeamName} ({winner})
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Adjudicator Notes & RFD
            </label>
            <textarea
              rows={2}
              value={rfdNotes}
              onChange={e => setRfdNotes(e.target.value)}
              placeholder="Reason for Decision explanation..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Transmitting to Cloud...' : 'Submit Official Ballot'}
          </button>
        </form>
      )}
    </div>
  );
};
