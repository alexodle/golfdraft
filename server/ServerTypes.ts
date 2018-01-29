import * as mongoose from 'mongoose';
import * as CommonTypes from '../common/types/CommonTypes';
import {Model, Document} from 'mongoose';

export type ObjectId = mongoose.Types.ObjectId;

export interface TourneySpecific {
  tourneyId: ObjectId;
}

export interface AppSettings extends CommonTypes.AppSettings, TourneySpecific {
  autoPickUsers: ObjectId[];
}
export interface AppSettingsDoc extends AppSettings, Document {}

export interface User extends CommonTypes.User, TourneySpecific {}
export interface UserDoc extends User, Document {}

export interface DraftPick extends CommonTypes.DraftPick, TourneySpecific {
  user: ObjectId;
  golfer: ObjectId;
}
export interface DraftPickDoc extends DraftPick, Document {}

export interface DraftPickOrder extends CommonTypes.DraftPickOrder, TourneySpecific {
  user: ObjectId;
}
export interface DraftPickOrderDoc extends DraftPickOrder, Document {}

export interface Golfer extends CommonTypes.Golfer, TourneySpecific {}
export interface GolferDoc extends Golfer, Document {}

export interface GolferScore extends CommonTypes.GolferScore, TourneySpecific {
  scores: any[];
}
export interface GolferScoreDoc extends GolferScore, Document {}

export interface ChatMessage extends CommonTypes.ChatMessage, TourneySpecific {
  user?: ObjectId;
}
export interface ChatMessageDoc extends ChatMessage, Document {}

export interface DraftPickList extends Document, TourneySpecific {
  userId: ObjectId;
  golferPickList: ObjectId[];
}
export interface DraftPickListDoc extends DraftPickList, Document {}

export interface WGR {
  name: string;
  wgr: number;
}
export interface WGRDoc extends WGR, Document {}

export interface Draft {
  picks: DraftPick[],
  pickOrder: DraftPickOrder[],
  serverTimestamp: Date
}
