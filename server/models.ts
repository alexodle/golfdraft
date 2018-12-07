import User from './User';
import {mongoose} from './mongooseUtil';

const SchemaTypes = mongoose.Schema.Types;

const golferSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  name: { type: String, required: true }
});
golferSchema.index({ name: 1, tourneyId: 1 }, { unique: true });

// Keep this separate for now, that way I don't have to change it often
const wgrSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  wgr: { type: Number, required: true }
});
wgrSchema.index({ name: 1 });
wgrSchema.index({ name: 1, wgr: 1 }, { unique: true });

const draftPickOrderSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  pickNumber: { type: Number, required: true },
  user: { type: SchemaTypes.ObjectId, required: true }
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 }, { unique: true });

const draftPickSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  user: { type: SchemaTypes.ObjectId, required: true },
  golfer: { type: SchemaTypes.ObjectId, required: true },
  pickNumber: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 }, { unique: true });
draftPickSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });

const draftPickListSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  userId: { type: SchemaTypes.ObjectId, required: true },
  golferPickList: [SchemaTypes.ObjectId]
});
draftPickListSchema.index({ tourneyId: 1, userId: 1 }, { unique: true });

const golferScoreSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  golfer: { type: SchemaTypes.ObjectId, required: true },
  day: Number,
  thru: Number,
  scores: [SchemaTypes.Mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });

const tourneyStandingsSchema = new mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  currentDay: Number,
  worstScoresForDay: [{
    day: Number,
    golfer: { type: SchemaTypes.ObjectId, required: true },
    score: Number
  }],
  playerScores: [{
    player: { type: SchemaTypes.ObjectId, required: true },
    totalScore: Number,
    standing: Number,
    isTied: Boolean,
    dayScores: [{
      day: Number,
      totalScore: Number,
      golferScores: [{
        golfer: { type: SchemaTypes.ObjectId, required: true },
        score: Number,
        thru: Number,
        missedCut: Boolean,
        scoreUsed: Boolean
      }]
    }]
  }]
});
tourneyStandingsSchema.index({ tourneyId: 1 }, { unique: true });

const appStateSchema = new mongoose.Schema({
  activeTourneyId: SchemaTypes.ObjectId,
  isDraftPaused: Boolean,
  allowClock: Boolean,
  draftHasStarted: Boolean,
  autoPickUsers: [SchemaTypes.ObjectId]
});

const tourneySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  lastUpdated: { type: Date, required: true },
  startDate: { type: Date, required: true },
  config: {
    scoresSync: {
      syncType: String,
      url: String,
      nameMap: [{ src: String, dest: String }],
    },
    draftOrder: [String],
    wgr: {
      url: String,
      nameMap: [{ src: String, dest: String }],
    }
  }
});

export { User };
export const Golfer = mongoose.model('Golfer', golferSchema);
export const WGR = mongoose.model('WGR', wgrSchema);
export const DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
export const DraftPick = mongoose.model('DraftPick', draftPickSchema);
export const DraftPickList = mongoose.model('DraftPickList', draftPickListSchema);
export const GolferScore = mongoose.model('GolferScore', golferScoreSchema);
export const GolferScoreOverrides = mongoose.model(
  'GolferScoreOverrides',
  golferScoreSchema
);
export const TourneyStandings = mongoose.model('TourneyStandings', tourneyStandingsSchema);
export const AppState = mongoose.model('AppState', appStateSchema);
export const Tourney = mongoose.model('Tourney', tourneySchema);
