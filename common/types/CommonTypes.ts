// ==== Util types ====

export interface Indexed<T> {
  readonly [id: string]: T;
}

export interface NumberIndexed<T> {
  readonly [n: number]: T;
}

export interface AppSettings {
  isDraftPaused: boolean;
  allowClock: boolean;
  draftHasStarted: boolean;
}

export interface User {
  _id: any;
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
  _id: any;
  name: string;
  wgr: number;
}

export interface GolferScore {
  golfer: string;
  day: number;
  thru: number;
}

export interface ChatMessage {
  isBot?: boolean;
  message: string;
  date: Date;
}
