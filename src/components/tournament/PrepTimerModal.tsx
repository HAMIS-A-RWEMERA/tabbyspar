import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Clock, Volume2 } from 'lucide-react';
import { gavel } from '../../services/audioGavel';

interface PrepTimerModalProps {
  initialMinutes: number;
  motionText: string;
  onClose: () => void;
}

export const PrepTimerModal: React.FC<PrepTimerModalProps> = ({
  initialMinutes,
  motionText,
  onClose,
}) => {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds(prev => {
          const next = prev - 1;
          if (next === 5 * 60) {
            gavel.knock(1); // 5 mins left
          }
          if (next === 60) {
            gavel.knock(1); // 1 min left
          }
          if (next === 0) {
            gavel.knock(2); // Prep finished!
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeftSeconds]);

  const m = Math.floor(timeLeftSeconds / 60);
  const s = timeLeftSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl text-center space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Official Motion Prep Clock
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-slate-400 uppercase font-mono">Current Motion</span>
          <h3 className="text-lg font-bold text-white max-w-xl mx-auto leading-relaxed">
            "{motionText}"
          </h3>
        </div>

        <div className="py-6">
          <div
            className={`text-7xl sm:text-8xl font-mono font-bold tracking-tight tabular-nums ${
              timeLeftSeconds <= 60 ? 'text-rose-500 animate-pulse' : 'text-white'
            }`}
          >
            {m}:{s < 10 ? '0' : ''}{s}
          </div>
          <span className="text-xs text-slate-400 font-mono mt-3 block">
            {timeLeftSeconds <= 0
              ? 'Prep Time Expired! Debaters Take Your Seats.'
              : isRunning
              ? 'Prep Clock Running · No Outside Coaching Permitted'
              : 'Prep Clock Paused'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
              isRunning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause Prep' : 'Resume Prep'}
          </button>

          <button
            onClick={() => {
              setTimeLeftSeconds(initialMinutes * 60);
              setIsRunning(false);
            }}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Reset Prep Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => gavel.knock(1)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            Sound Gavel
          </button>
        </div>
      </div>
    </div>
  );
};
