import * as CommonTypes from '../../common/types/CommonTypes';
import {Indexed, NumberIndexed} from '../../common/types/CommonTypes';

export {Indexed, NumberIndexed};

export interface AppSettings extends CommonTypes.AppSettings {
  autoPickUsers: Indexed<string>;
}

export interface User extends CommonTypes.User {
  _id: string;
}
export interface IndexedUsers extends Indexed<User> {}

export interface Location {
  state?: {
    from?: string;
  };
}

export interface DraftPick extends CommonTypes.DraftPick {
  user: string;
  golfer: string;
  clientTimestamp: Date;
}

export interface DraftPickOrder extends CommonTypes.DraftPickOrder {
  user: string;
}

export interface Golfer extends CommonTypes.Golfer {
  _id: string;
}
export interface IndexedGolfers extends Indexed<Golfer> {}

export interface GolferScore extends CommonTypes.GolferScore {
  total: number;
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

export interface ChatMessage extends CommonTypes.ChatMessage {
  user?: string;
}
