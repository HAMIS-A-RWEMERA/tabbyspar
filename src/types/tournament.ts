export type DebateFormat = 'WSDC' | 'BP' | 'AP' | 'SPAR_1V1';

export interface Speaker {
  id: string;
  name: string;
  isNovice?: boolean;
}

export interface Team {
  id: string;
  name: string;
  institution: string;
  speakers: Speaker[];
  points: number; // Wins in WSDC/AP, or match points in BP (3/2/1/0)
  totalSpeakerScore: number;
  pullupsCount: number;
  historySides: ('Gov' | 'Opp' | 'OG' | 'OO' | 'CG' | 'CO')[];
  pastOpponentIds: string[];
}

export interface Adjudicator {
  id: string;
  name: string;
  institution: string;
  score: number; // 1-10 ranking (10 is CA/top tier)
  isChair: boolean;
  institutionClashes: string[];
  teamClashes: string[];
}

export interface Motion {
  id: string;
  roundNumber: number;
  motionText: string;
  infoSlide?: string;
  category: string;
  isReleased: boolean;
  releaseTime?: string;
}

export interface WSDCSpeechScore {
  speakerId: string;
  speakerName: string;
  role: 'Prop 1' | 'Prop 2' | 'Prop 3' | 'Opp 1' | 'Opp 2' | 'Opp 3';
  score: number; // 60-80
}

export interface WSDCBallot {
  govSpeakerScores: WSDCSpeechScore[];
  oppSpeakerScores: WSDCSpeechScore[];
  govReplyScore: number; // 30-40
  oppReplyScore: number; // 30-40
  govTotal: number;
  oppTotal: number;
  winner: 'Gov' | 'Opp';
  adjudicatorNotes?: string;
}

export interface BPBallot {
  ranks: {
    og: number; // 1, 2, 3, or 4
    oo: number;
    cg: number;
    co: number;
  };
  speakerScores: Record<string, number>; // 50-100
  adjudicatorNotes?: string;
}

export interface Pairing {
  id: string;
  roomName: string;
  roundNumber: number;
  // For 2-team (WSDC / AP / SPAR)
  govTeamId?: string;
  oppTeamId?: string;
  // For 4-team (BP)
  bpTeamIds?: {
    og: string;
    oo: string;
    cg: string;
    co: string;
  };
  judgeIds: string[];
  chairId: string;
  ballotSubmitted: boolean;
  wsdcBallot?: WSDCBallot;
  bpBallot?: BPBallot;
}

export interface Round {
  id: string;
  number: number;
  name: string;
  isCompleted: boolean;
  isSilent: boolean;
  motionId?: string;
  pairings: Pairing[];
}

export interface Tournament {
  id: string;
  name: string;
  format: DebateFormat;
  currentRound: number;
  totalRounds: number;
  teams: Team[];
  adjudicators: Adjudicator[];
  rounds: Round[];
  motions: Motion[];
  prepTimeMinutes: number;
}
