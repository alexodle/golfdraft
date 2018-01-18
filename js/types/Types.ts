export interface User {
  name: string;
  _id: string;
}

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

export interface Golfer {
  name: string;
  _id: string;
}

export interface GolferScore {
  golfer: string;
  total: number;
  day: number;
  thru: number;
  missedCuts: boolean[];
  scores: number[];
}

export interface UserDayScore {
  day: number;
  total: number;
  allScores: GolferScore[];
  usedScores: GolferScore[];
}

export interface UserScore {
  total: number;
  scoresByGolfer: { [key: string]: GolferScore };
  scoresByDay: { [key: string]: UserDayScore };
}

export interface ChatMessage {
  user: string;
  isBot: boolean;
  message: string;
  date: string;
}
