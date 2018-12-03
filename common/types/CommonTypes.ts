// ==== Util types ====

export interface Indexed<T> {
  [id: string]: T;
}

export interface NumberIndexed<T> {
  [n: number]: T;
}

export interface AppSettings {
  activeTourneyId: string;
  isDraftPaused: boolean;
  allowClock: boolean;
  draftHasStarted: boolean;
}

export interface User {
  _id?: any;
  name: string;
  username: string;
}

export interface DraftPick {
  pickNumber: number;
  timestamp: Date;
}

export interface DraftPickOrder {
  pickNumber: number;
}

export interface Golfer {
  _id?: any;
  name: string;
  wgr: number;
}

export interface PlayerScore {
  player: string;
  totalScore: number;
  standing: number;
  isTied: boolean;
  dayScores: [{
    day: number;
    totalScore: number;
    golferScores: [{
      golfer: string;
      score: number;
      thru: number | null;
      missedCut: boolean;
      scoreUsed: boolean;
    }];
  }];
}

export interface TourneyStandings {
  currentDay: number;
  worstScoresForDay: { day: number, golfer: string; score: number; }[],
  playerScores: PlayerScore[];
}

export interface ChatMessage {
  isBot?: boolean;
  message: string;
  date: Date;
}

export interface Tourney {
  _id?: any;
  name: string;
  startDate: Date;
  lastUpdated: Date;
}