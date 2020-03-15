import * as CommonTypes from '../common/types/CommonTypes';
import { Indexed, NumberIndexed } from '../common/types/CommonTypes';

export type { Indexed, NumberIndexed };

export type Tourney = CommonTypes.Tourney;

export interface AppSettings extends CommonTypes.AppSettings {
  autoPickUsers: Indexed<string>;
}

export interface User extends CommonTypes.User {
  _id: string;
}
export interface IndexedUsers extends Indexed<User> { }

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
export interface IndexedGolfers extends Indexed<Golfer> { }

export interface TourneyStandings extends CommonTypes.TourneyStandings { }

export interface ChatMessage extends CommonTypes.ChatMessage {
  user?: string;
}

export interface Draft {
  picks: DraftPick[],
  pickOrder: DraftPickOrder[],
  serverTimestamp: Date
}

export interface BootstrapPayload {
  golfers: Golfer[];
  users: User[];
  draft: Draft;
  tourneyStandings: TourneyStandings;
  tourney: Tourney;
  userPickList: string[] | null;
  pickListUsers: string[];
  appState: AppSettings;
  user: User;
  activeTourneyId: string;
  allTourneys: Tourney[];
  prod: boolean;
  cdnUrl: string;
}
