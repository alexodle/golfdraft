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
