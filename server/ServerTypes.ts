import * as mongoose from 'mongoose';
import * as CommonTypes from '../common/types/CommonTypes';
import {Model, Document} from 'mongoose';

export type ObjectId = mongoose.Types.ObjectId;

export interface TourneySpecific {
  tourneyId?: ObjectId;
}

export interface AppSettings extends CommonTypes.AppSettings, TourneySpecific {
  autoPickUsers: ObjectId[];
}
export type AppSettingsDoc = AppSettings & Document;

export interface User extends CommonTypes.User, TourneySpecific {
  password?: string;
}
export type UserDoc = User & Document;

export interface DraftPick extends CommonTypes.DraftPick, TourneySpecific {
  user: ObjectId;
  golfer: ObjectId;
}
export type DraftPickDoc = DraftPick & Document;

export interface DraftPickOrder extends CommonTypes.DraftPickOrder, TourneySpecific {
  user: ObjectId;
}
export type DraftPickOrderDoc = DraftPickOrder & Document;

export interface Golfer extends CommonTypes.Golfer, TourneySpecific {}
export type GolferDoc = Golfer & Document;

export interface GolferScore extends CommonTypes.GolferScore, TourneySpecific {
  scores: any[];
}
export type GolferScoreDoc = GolferScore & Document;

export interface PlayerScore extends CommonTypes.PlayerScore {}

export interface TourneyStandings extends CommonTypes.TourneyStandings, TourneySpecific {}
export type TourneyStandingsDoc = TourneyStandings & Document;

export interface ChatMessage extends CommonTypes.ChatMessage, TourneySpecific {
  user?: ObjectId;
}
export type ChatMessageDoc = ChatMessage & Document;

export interface DraftPickList extends TourneySpecific {
  userId: ObjectId;
  golferPickList: ObjectId[];
}
export type DraftPickListDoc = DraftPickList & Document;

export interface WGR {
  name: string;
  wgr: number;
}
export type WGRDoc = WGR & Document;

export interface Draft {
  picks: DraftPick[],
  pickOrder: DraftPickOrder[],
  serverTimestamp: Date
}

export interface ScoreOverride extends TourneySpecific {
  golfer: ObjectId;
  day: number;
  scores: any[];
}
export type ScoreOverrideDoc = ScoreOverride & Document;

