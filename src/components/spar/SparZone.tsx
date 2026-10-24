import React, { useState, useEffect, useRef } from 'react';
import {
  Gavel,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Award,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  HelpCircle,
  Radio,
  Sliders,
  Settings2,
  MessageSquare,
} from 'lucide-react';
import { gavel } from '../../services/audioGavel';
import { sampleMotionsBank } from '../../data/sampleTournaments';

interface SpeechEntry {
  speaker: string;
  side: 'Proposition' | 'Opposition';
  role: string;
  content: string;
  durationSeconds?: number;
  audioBase64?: string;
}

interface ClashItem {
  title: string;
  propPosition: string;
  oppPosition: string;
  resolution: string;
  winningSide: string;
}

interface SpeakerScoreItem {
  speaker: string;
  role: string;
  side: string;
  totalScore: number;
  contentScore: number;
  styleScore: number;
  strategyScore: number;
  feedback: string;
}

interface AdjudicationResult {
  winner: string;
  decisionMargin: string;
  rfdSummary: string;
  clashes: ClashItem[];
  speakerScores: SpeakerScoreItem[];
  coachingTips: string[];
}

export const SparZone: React.FC = () => {
  // Debate Configuration
  const [format, setFormat] = useState<'WSDC_8MIN' | 'WSDC_4MIN' | 'BP_SPAR' | 'RAPID_3MIN'>('WSDC_4MIN');
  const [motion, setMotion] = useState<string>(sampleMotionsBank[0].motionText);
  const [userSide, setUserSide] = useState<'Proposition' | 'Opposition'>('Proposition');
  const [userRole, setUserRole] = useState<string>('1st Proposition (Prime Minister)');
  const [aiRole, setAiRole] = useState<string>('1st Opposition (Leader of Opposition)');

  // Voice & Audio Settings
  const [autoSpeakAloud, setAutoSpeakAloud] = useState<boolean>(true);
  const [aiVoicePersona, setAiVoicePersona] = useState<'Fenrir' | 'Kore' | 'Puck' | 'Zephyr' | 'browser'>('Fenrir');
  const [speakingRate, setSpeakingRate] = useState<number>(1.1); // 1.1x brisk debate pace
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState<boolean>(false);
  const [currentSpeechSentence, setCurrentSpeechSentence] = useState<string>('');
  const [activeSpeakingTitle, setActiveSpeakingTitle] = useState<string>('');

  // Round State
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [speeches, setSpeeches] = useState<SpeechEntry[]>([]);

  // Speech Duration Config (in seconds)
  const getSpeechDuration = () => {
    switch (format) {
      case 'WSDC_8MIN':
        return 8 * 60; // 8 minutes
      case 'WSDC_4MIN':
        return 4 * 60; // 4 minutes
      case 'BP_SPAR':
        return 7 * 60; // 7 minutes
      case 'RAPID_3MIN':
        return 3 * 60; // 3 minutes
    }
  };

  // Timer & Gavel State
  const [timeLeft, setTimeLeft] = useState<number>(getSpeechDuration());
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [hasKnockedOneMin, setHasKnockedOneMin] = useState<boolean>(false);
  const [hasKnockedProtectedEnd, setHasKnockedProtectedEnd] = useState<boolean>(false);
  const [hasKnockedOvertime, setHasKnockedOvertime] = useState<boolean>(false);

  // User Speech Drafting & Speech-to-Text
  const [userDraftText, setUserDraftText] = useState<string>('');
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // AI Opponent generation state
  const [isGeneratingAiSpeech, setIsGeneratingAiSpeech] = useState<boolean>(false);

  // Audio elements & synthesis refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // POI Interruption State
  const [isPoiModalOpen, setIsPoiModalOpen] = useState<boolean>(false);
  const [poiQuestionText, setPoiQuestionText] = useState<string>('');
  const [isAnsweringPoi, setIsAnsweringPoi] = useState<boolean>(false);
  const [poiAnswerResult, setPoiAnswerResult] = useState<string | null>(null);
  const pausedSpeechIndexRef = useRef<number | null>(null);

  // Adjudication state
  const [isJudging, setIsJudging] = useState<boolean>(false);
  const [adjudication, setAdjudication] = useState<AdjudicationResult | null>(null);
  const [isReadingRfdAloud, setIsReadingRfdAloud] = useState<boolean>(false);

  // Format change handler
  const handleFormatChange = (newFormat: 'WSDC_8MIN' | 'WSDC_4MIN' | 'BP_SPAR' | 'RAPID_3MIN') => {
    setFormat(newFormat);
    let dur = 4 * 60;
    if (newFormat === 'WSDC_8MIN') dur = 8 * 60;
    if (newFormat === 'BP_SPAR') dur = 7 * 60;
    if (newFormat === 'RAPID_3MIN') dur = 3 * 60;
    setTimeLeft(dur);
    setTimerRunning(false);
  };

  // Gavel timer ticks
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          const totalDur = getSpeechDuration();
          const elapsed = totalDur - next;

          if (elapsed === 60 && !hasKnockedOneMin) {
            gavel.knock(1);
            setHasKnockedOneMin(true);
          }

          const protectedThreshold = totalDur > 180 ? 60 : 30;
          if (next === protectedThreshold && !hasKnockedProtectedEnd) {
            gavel.knock(1);
            setHasKnockedProtectedEnd(true);
          }

          if (next === 0) {
            gavel.knock(2);
          }

          if (next === -15 && !hasKnockedOvertime) {
            gavel.knock(3);
            setHasKnockedOvertime(true);
          }

          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, hasKnockedOneMin, hasKnockedProtectedEnd, hasKnockedOvertime, format]);

  // Speech-to-text Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserDraftText(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecordingMic(false);
      };

      recognition.onend = () => {
        setIsRecordingMic(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMicRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-text is supported natively in Chrome, Edge, and Safari.');
      return;
    }

    if (isRecordingMic) {
      recognitionRef.current.stop();
      setIsRecordingMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecordingMic(true);
        if (!timerRunning) setTimerRunning(true);
      } catch (err) {
        console.warn('Could not start recognition', err);
      }
    }
  };

  // Stop any playing speech (Gemini audio or browser synthesis)
  const stopAllSpeech = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsCurrentlySpeaking(false);
    setIsReadingRfdAloud(false);
    setCurrentSpeechSentence('');
  };

  // Speak text aloud using dual-engine (Gemini Neural TTS or Web Speech Synthesis)
  const speakTextAloud = async (
    text: string,
    title: string,
    existingAudioBase64?: string
  ) => {
    stopAllSpeech();
    setIsCurrentlySpeaking(true);
    setActiveSpeakingTitle(title);
    setCurrentSpeechSentence(text.substring(0, 120) + '...');

    // If already pre-rendered Gemini base64 audio exists, play it directly
    if (existingAudioBase64 && aiVoicePersona !== 'browser') {
      try {
        const audio = new Audio(`data:audio/wav;base64,${existingAudioBase64}`);
        audioPlayerRef.current = audio;
        audio.playbackRate = speakingRate;
        audio.play();
        audio.onended = () => {
          setIsCurrentlySpeaking(false);
          setCurrentSpeechSentence('');
        };
        audio.onerror = () => {
          fallbackBrowserSpeech(text);
        };
        return;
      } catch (err) {
        console.warn('Audio element error, falling back to browser synthesis', err);
      }
    }

    // Try fetching neural Gemini TTS if persona is Fenrir/Kore/Puck/Zephyr
    if (aiVoicePersona !== 'browser') {
      try {
        const res = await fetch('/api/spar/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: aiVoicePersona,
          }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioPlayerRef.current = audio;
          audio.playbackRate = speakingRate;
          audio.play();
          audio.onended = () => {
            setIsCurrentlySpeaking(false);
            setCurrentSpeechSentence('');
          };
          audio.onerror = () => {
            fallbackBrowserSpeech(text);
          };
          return;
        }
      } catch (err) {
        console.warn('Gemini TTS failed, falling back to browser speech synthesis', err);
      }
    }

    // Fallback or explicit Browser Speech Synthesis (zero buffering, sentence highlighting)
    fallbackBrowserSpeech(text);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsCurrentlySpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance;
    utterance.rate = speakingRate;
    utterance.pitch = 1.0;

    // Pick best English voice available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(v => v.lang.includes('en-GB') || v.name.includes('Daniel') || v.name.includes('Arthur')) ||
      voices.find(v => v.lang.includes('en-US')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Sentence tracking
    utterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.name === 'word') {
        const slice = text.substring(event.charIndex, event.charIndex + 140);
        setCurrentSpeechSentence(slice);
      }
    };

    utterance.onend = () => {
      setIsCurrentlySpeaking(false);
      setCurrentSpeechSentence('');
      setIsReadingRfdAloud(false);
    };

    utterance.onerror = () => {
      setIsCurrentlySpeaking(false);
      setCurrentSpeechSentence('');
      setIsReadingRfdAloud(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartDebate = () => {
    stopAllSpeech();
    setIsDebateActive(true);
    setSpeeches([]);
    setCurrentTurn(0);
    setTimeLeft(getSpeechDuration());
    setTimerRunning(false);
    setHasKnockedOneMin(false);
    setHasKnockedProtectedEnd(false);
    setHasKnockedOvertime(false);
    setAdjudication(null);

    // If user is Opposition, AI speaks first as Proposition!
    if (userSide === 'Opposition') {
      triggerAiSpeech('Proposition', '1st Proposition (Prime Minister)', []);
    }
  };

  const triggerAiSpeech = async (side: 'Proposition' | 'Opposition', role: string, history: SpeechEntry[]) => {
    setIsGeneratingAiSpeech(true);
    try {
      const res = await fetch('/api/spar/opponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motion,
          format,
          side: side === 'Proposition' ? 'Gov' : 'Opp',
          roundRole: role,
          speechHistory: history,
        }),
      });

      const data = await res.json();
      if (data.speechText) {
        const newSpeech: SpeechEntry = {
          speaker: `AI Debater (${side})`,
          side,
          role,
          content: data.speechText,
        };

        const updatedSpeeches = [...history, newSpeech];
        setSpeeches(updatedSpeeches);
        setCurrentTurn(updatedSpeeches.length);

        // Pre-fetch TTS and auto-speak aloud if enabled!
        if (autoSpeakAloud) {
          speakTextAloud(data.speechText, `${role} - AI Debater (${side})`);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI speech:', err);
    } finally {
      setIsGeneratingAiSpeech(false);
    }
  };

  const handleUserSubmitSpeech = () => {
    if (!userDraftText.trim()) return;

    if (isRecordingMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecordingMic(false);
    }

    setTimerRunning(false);

    const userSpeech: SpeechEntry = {
      speaker: 'You (Human Debater)',
      side: userSide,
      role: speeches.length === 0 ? userRole : `Rebuttal / ${userSide} 2`,
      content: userDraftText.trim(),
      durationSeconds: getSpeechDuration() - timeLeft,
    };

    const updatedSpeeches = [...speeches, userSpeech];
    setSpeeches(updatedSpeeches);
    setUserDraftText('');
    setCurrentTurn(updatedSpeeches.length);

    // Reset speech timer for the next turn
    setTimeLeft(getSpeechDuration());
    setHasKnockedOneMin(false);
    setHasKnockedProtectedEnd(false);
    setHasKnockedOvertime(false);

    // Trigger AI response if debate has not reached 4 turns
    if (updatedSpeeches.length < 4) {
      const nextAiSide = userSide === 'Proposition' ? 'Opposition' : 'Proposition';
      const nextAiRole = updatedSpeeches.length === 1 ? aiRole : `Rebuttal / ${nextAiSide} 2`;
      triggerAiSpeech(nextAiSide, nextAiRole, updatedSpeeches);
    }
  };

  // POI: Standing up and interrupting AI during its speech
  const handleTriggerPoiInterruption = () => {
    // 1. Pause current speaking audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsCurrentlySpeaking(false);

    // 2. Sound the gavel for POI
    gavel.knock(1);

    // 3. Open interactive POI prompt
    setIsPoiModalOpen(true);
    setPoiQuestionText('');
    setPoiAnswerResult(null);
  };

  const handleConfirmPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poiQuestionText.trim()) return;

    setIsAnsweringPoi(true);
    try {
      const lastAiSpeech = speeches[speeches.length - 1]?.content || '';
      const res = await fetch('/api/spar/poi-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motion,
          currentSpeech: lastAiSpeech,
          poiQuestion: poiQuestionText.trim(),
          side: userSide === 'Proposition' ? 'Opposition' : 'Proposition',
        }),
      });

      const data = await res.json();
      const answer = data.poiAnswer || 'I acknowledge your point, but our core mechanism remains intact.';
      setPoiAnswerResult(answer);

      // Speak the POI answer aloud!
      const verbalPoiAnswer = `On your point: ${answer} And now returning to our substantive arguments...`;
      speakTextAloud(verbalPoiAnswer, 'AI Debater Responding to POI');
    } catch (err) {
      console.warn('POI response error:', err);
    } finally {
      setIsAnsweringPoi(false);
    }
  };

  const handleResumeAfterPoi = () => {
    setIsPoiModalOpen(false);
    setPoiAnswerResult(null);
    setPoiQuestionText('');

    // Resume speech
    if (audioPlayerRef.current && audioPlayerRef.current.paused) {
      audioPlayerRef.current.play();
      setIsCurrentlySpeaking(true);
    } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsCurrentlySpeaking(true);
    }
  };

  const handleRequestAdjudication = async () => {
    if (speeches.length === 0) return;
    setIsJudging(true);
    try {
      const res = await fetch('/api/spar/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motion,
          format,
          speeches,
        }),
      });
      const data = await res.json();
      setAdjudication(data);

      // Auto-speak Oral Adjudication summary if auto-speak is enabled
      if (autoSpeakAloud && data.rfdSummary) {
        setIsReadingRfdAloud(true);
        speakTextAloud(
          `Official Adjudication for this round. The panel awards this debate to the ${data.winner}, by a margin of ${data.decisionMargin}. ${data.rfdSummary}`,
          'Chief Adjudicator RFD'
        );
      }
    } catch (err) {
      console.error('Adjudication error:', err);
    } finally {
      setIsJudging(false);
    }
  };

  const handleReadRfdAloud = () => {
    if (!adjudication) return;
    if (isReadingRfdAloud) {
      stopAllSpeech();
    } else {
      setIsReadingRfdAloud(true);
      speakTextAloud(
        `Official Reason for Decision. The panel awards this debate to the ${adjudication.winner}, on a margin of ${adjudication.decisionMargin}. ${adjudication.rfdSummary}`,
        'Chief Adjudicator Oral Adjudication'
      );
    }
  };

  const formatTime = (secs: number) => {
    const isNegative = secs < 0;
    const absSecs = Math.abs(secs);
    const m = Math.floor(absSecs / 60);
    const s = absSecs % 60;
    return `${isNegative ? '-' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const wordCount = userDraftText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMin = (wordCount / 140).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Spar Header, Voice Engine Settings & Format */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                AI Debate Spar Zone
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Impromptu sparring with <strong>audible spoken voice exchange</strong>, real-time gavel strikes, vocal POI interruptions, and Oral Adjudication (RFD).
            </p>
          </div>

          {/* Voice & Format Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Speak Aloud Toggle */}
            <button
              onClick={() => {
                const nextState = !autoSpeakAloud;
                setAutoSpeakAloud(nextState);
                if (!nextState) stopAllSpeech();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                autoSpeakAloud
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="When enabled, the AI opponent and judge will speak back aloud automatically"
            >
              {autoSpeakAloud ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              AI Speaks Aloud: {autoSpeakAloud ? 'ON' : 'OFF'}
            </button>

            {/* AI Voice Persona Selector */}
            <select
              value={aiVoicePersona}
              onChange={e => setAiVoicePersona(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none"
              title="Select AI speaker voice personality"
            >
              <option value="Fenrir">Voice: Fenrir (Oxford RP Debater)</option>
              <option value="Kore">Voice: Kore (Collegiate Orator)</option>
              <option value="Puck">Voice: Puck (Rapid Rebuttalist)</option>
              <option value="Zephyr">Voice: Zephyr (Calm Adjudicator)</option>
              <option value="browser">Voice: Browser Native Voice</option>
            </select>

            {/* Speaking Rate Selector */}
            <select
              value={speakingRate}
              onChange={e => setSpeakingRate(parseFloat(e.target.value))}
              className="px-2 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none"
              title="Speech delivery pacing"
            >
              <option value={1.0}>1.0x Pace</option>
              <option value={1.15}>1.15x Debate Cadence</option>
              <option value={1.3}>1.3x High-Speed Spar</option>
            </select>
          </div>
        </div>

        {/* Live Audio Speaker Podium Bar (When AI is speaking aloud) */}
        {isCurrentlySpeaking && (
          <div className="bg-indigo-950/70 border border-indigo-500/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              {/* Animated Soundwave Visualizer */}
              <div className="flex items-end gap-1 h-6 shrink-0">
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms] h-3" />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms] h-6" />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms] h-4" />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:75ms] h-5" />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:225ms] h-2" />
              </div>

              <div>
                <span className="text-xs font-bold text-white block">
                  {activeSpeakingTitle || 'AI Debater is Speaking on the Floor'}
                </span>
                <p className="text-[11px] text-indigo-200 italic line-clamp-1 max-w-xl">
                  "{currentSpeechSentence}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Stand for POI button */}
              <button
                onClick={handleTriggerPoiInterruption}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Stand for POI (Interrupt)
              </button>

              <button
                onClick={stopAllSpeech}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Mute Voice
              </button>
            </div>
          </div>
        )}

        {/* Motion Input & Side Choice */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Debate Motion (Resolution)</label>
              <button
                onClick={() => {
                  const randomM = sampleMotionsBank[Math.floor(Math.random() * sampleMotionsBank.length)];
                  setMotion(randomM.motionText);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Pick Random Motion
              </button>
            </div>
            <input
              type="text"
              value={motion}
              onChange={e => setMotion(e.target.value)}
              disabled={isDebateActive}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60 font-sans"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Your Side</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUserSide('Proposition')}
                disabled={isDebateActive}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                  userSide === 'Proposition'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Proposition (Gov)
              </button>
              <button
                onClick={() => setUserSide('Opposition')}
                disabled={isDebateActive}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                  userSide === 'Opposition'
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Opposition (Opp)
              </button>
            </div>
          </div>
        </div>

        {/* Action button */}
        {!isDebateActive ? (
          <button
            onClick={handleStartDebate}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Enter Debate Arena & Commence Verbal Spar
          </button>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              ● Spar in Progress · Turn {speeches.length + 1}
            </span>
            <button
              onClick={() => {
                if (window.confirm('Reset this spar round?')) {
                  stopAllSpeech();
                  setIsDebateActive(false);
                  setSpeeches([]);
                  setAdjudication(null);
                  setTimerRunning(false);
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-400 font-mono transition-colors"
            >
              Reset Round
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE DEBATE ARENA */}
      {isDebateActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Debate Transcript & Speech Replay */}
          <div className="lg:col-span-2 space-y-4">
            {/* Speeches Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Chamber Speeches Transcript</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {speeches.length} Speeches Delivered
                </span>
              </div>

              {speeches.length === 0 && !isGeneratingAiSpeech && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Awaiting the first speech. Prepare your substantive case and click Submit Speech.
                </div>
              )}

              {speeches.map((sp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    sp.side === 'Proposition'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          sp.side === 'Proposition' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {sp.speaker}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({sp.role})
                      </span>
                    </div>

                    {/* Listen / Replay Button */}
                    <button
                      onClick={() => speakTextAloud(sp.content, `${sp.role} - ${sp.speaker}`, sp.audioBase64)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen Aloud
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {sp.content}
                  </p>
                </div>
              ))}

              {isGeneratingAiSpeech && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-center space-y-2 animate-pulse">
                  <span className="text-xs font-semibold text-indigo-400">
                    AI Opponent is formulating arguments and preparing verbal delivery...
                  </span>
                  <div className="h-1.5 w-32 bg-indigo-600 rounded-full mx-auto" />
                </div>
              )}
            </div>

            {/* User Speech Input & Mic Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Your Speech ({userSide})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {wordCount} words · ~{estimatedMin} min pace
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMicRecording}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                      isRecordingMic
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isRecordingMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecordingMic ? 'Stop Mic' : 'Live Speech-to-Text'}
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={userDraftText}
                onChange={e => setUserDraftText(e.target.value)}
                placeholder="Speak into your microphone or draft your arguments: roadmap, refutations, substantive mechanisms, and delta weighing..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => gavel.knock(1)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Gavel className="w-3.5 h-3.5 text-amber-400" />
                  Sound Gavel
                </button>

                <button
                  onClick={handleUserSubmitSpeech}
                  disabled={!userDraftText.trim() || isGeneratingAiSpeech}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Deliver Speech & Yield Floor
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Official Speech Timer, Gavel Strikes, & Oral Adjudication */}
          <div className="space-y-4">
            {/* Gavel & Official Debate Timer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center space-y-4 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Official Floor Timer
              </span>

              <div
                className={`text-5xl font-mono font-bold tracking-tight tabular-nums ${
                  timeLeft <= 0 ? 'text-rose-500 animate-pulse' : 'text-white'
                }`}
              >
                {formatTime(timeLeft)}
              </div>

              {/* Status Indicator */}
              <div className="text-xs font-mono">
                {timeLeft > getSpeechDuration() - 60 ? (
                  <span className="text-slate-400">🔒 Protected Time (No POIs)</span>
                ) : timeLeft <= 60 && timeLeft > 0 ? (
                  <span className="text-slate-400">🔒 Protected Time (Closing)</span>
                ) : timeLeft <= 0 ? (
                  <span className="text-rose-400 font-bold">⚠️ OVERTIME</span>
                ) : (
                  <span className="text-emerald-400">🔔 Floor Open for POIs</span>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                    timerRunning
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timerRunning ? 'Pause' : 'Start Timer'}
                </button>

                <button
                  onClick={() => {
                    setTimeLeft(getSpeechDuration());
                    setTimerRunning(false);
                    setHasKnockedOneMin(false);
                    setHasKnockedProtectedEnd(false);
                    setHasKnockedOvertime(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => gavel.knock(1)}
                  className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Strike Gavel (1 Knock)"
                >
                  <Gavel className="w-4 h-4 text-amber-400" />
                  Knock
                </button>
              </div>

              {/* Gavel rules cheat-sheet */}
              <div className="text-[11px] text-slate-500 font-mono text-left pt-2 border-t border-slate-800/80 space-y-1">
                <div>• 1 knock at 1:00 (POIs open)</div>
                <div>• 1 knock at 1:00 remaining (POIs close)</div>
                <div>• 2 knocks at time expiration</div>
                <div>• Continuous gavel for overtime</div>
              </div>
            </div>

            {/* Adjudication Trigger Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Oral Adjudication & RFD
              </h4>
              <p className="text-xs text-slate-400">
                When speeches are concluded, submit the round to the AI Chief Adjudicator for a verbal RFD, clash analysis, and speaker marks.
              </p>
              <button
                onClick={handleRequestAdjudication}
                disabled={speeches.length === 0 || isJudging}
                className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isJudging ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Chief Adjudicator Deliberating...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Call for Oral Adjudication
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE POI INTERRUPTION MODAL */}
      {isPoiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Point of Information (15s Floor Time)
                </h3>
              </div>
              <button
                onClick={handleResumeAfterPoi}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel / Decline
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You stood up to interrupt the AI speaker. Deliver your sharpest factual or logical challenge:
            </p>

            <form onSubmit={handleConfirmPoi} className="space-y-3">
              <textarea
                rows={3}
                value={poiQuestionText}
                onChange={e => setPoiQuestionText(e.target.value)}
                placeholder="e.g. If the government passes this policy, how do you prevent immediate capital flight into offshore havens?"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResumeAfterPoi}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Sit Down
                </button>

                <button
                  type="submit"
                  disabled={!poiQuestionText.trim() || isAnsweringPoi}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  {isAnsweringPoi ? 'AI Responding Aloud...' : 'Deliver POI & Hear AI Answer'}
                </button>
              </div>
            </form>

            {poiAnswerResult && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg space-y-2">
                <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                  AI Speaker's Verbal Response:
                </span>
                <p className="text-xs text-slate-200 italic">
                  "{poiAnswerResult}"
                </p>
                <button
                  onClick={handleResumeAfterPoi}
                  className="w-full mt-2 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  Continue Main Speech
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUDICATION / RFD MODAL OR PANEL */}
      {adjudication && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">
                Official World Championship Adjudication
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Reason for Decision (RFD):{' '}
                <span className="text-emerald-400">{adjudication.winner} Win</span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold rounded-lg">
                Margin: {adjudication.decisionMargin}
              </span>

              {/* Listen RFD Aloud Button */}
              <button
                onClick={handleReadRfdAloud}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {isReadingRfdAloud ? 'Stop Oral RFD' : 'Listen to Oral RFD'}
              </button>
            </div>
          </div>

          {/* RFD Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono mb-2">
              Oral Adjudication Summary
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {adjudication.rfdSummary}
            </p>
          </div>

          {/* Clash-by-Clash Analysis */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono">
              Clash Breakdown & Comparative Delta
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adjudication.clashes.map((c, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        c.winningSide === 'Proposition'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      Won by {c.winningSide}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{c.resolution}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Speaker Scores Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono">
              Speaker Marks & Feedback (WSDC Rubric)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adjudication.speakerScores.map((spkr, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{spkr.speaker}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spkr.role} ({spkr.side})
                      </span>
                    </div>
                    <span className="text-lg font-mono font-bold text-indigo-400 tabular-nums">
                      {spkr.totalScore}
                      <span className="text-xs text-slate-500"> / 80</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-slate-900/60 p-1.5 rounded">
                    <div>
                      <span className="text-slate-400 block">Content</span>
                      <span className="text-white font-bold">{spkr.contentScore}/40</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Style</span>
                      <span className="text-white font-bold">{spkr.styleScore}/40</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Strategy</span>
                      <span className="text-white font-bold">{spkr.strategyScore}/20</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic pt-1">{spkr.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Coaching Tips */}
          {adjudication.coachingTips && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase font-mono">
                Chief Adjudicator's Coaching Takeaways
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {adjudication.coachingTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
