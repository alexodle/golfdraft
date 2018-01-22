// ==== Util types ====

export interface Indexed<T> {
  readonly [id: string]: T;
}

export interface NumberIndexed<T> {
  readonly [n: number]: T;
}

// ==== App types ====

export interface AppSettings {
  isDraftPaused: boolean;
  allowClock: boolean;
  draftHasStarted: boolean;
  autoPickUsers: Indexed<string>;
}

export interface User {
  name: string;
  username: string;
  _id: string;
}
export interface IndexedUsers extends Indexed<User> {}

export interface Location {
  state?: {
    from?: string;
  };
}

export interface DraftPick {
  user: string;
  golfer: string;
  pickNumber: number;
  timestamp: Date;
  clientTimestamp: Date;
}

export interface DraftPickOrder {
  user: string;
  pickNumber: number;
}

export interface Golfer {
  name: string;
  wgr: number;
  _id: string;
}
export interface IndexedGolfers extends Indexed<Golfer> {}

export interface GolferScore {
  golfer: string;
  total: number;
  day: number;
  thru: number;
  missedCuts: boolean[];
  scores: number[];
}
export interface IndexedGolferScores extends Indexed<GolferScore> {}

export interface UserDayScore {
  day: number;
  total: number;
  allScores: GolferScore[];
  usedScores: GolferScore[];
}
export interface IndexedUserDayScores extends NumberIndexed<UserDayScore> {}

export interface UserScore {
  user: string;
  total: number;
  pickNumber: number;
  scoresByGolfer: IndexedGolferScores;
  scoresByDay: IndexedUserDayScores;
}
export interface IndexedUserScores extends Indexed<UserScore> {}

export interface ChatMessage {
  user: string;
  isBot: boolean;
  message: string;
  date: string;
}
