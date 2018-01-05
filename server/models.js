'use strict';

const mongoose = require('mongoose');
const SchemaTypes = mongoose.Schema.Types;

const golferSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  name: String
});
golferSchema.index({ name: 1, tourneyId: 1 });

// Keep this separate for now, that way I don't have to change it often
const wgrSchema = mongoose.Schema({
  name: String,
  wgr: Number
});
wgrSchema.index({ name: 1 });

// For now these are the same
const playerSchema = golferSchema;

const draftPickOrderSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  pickNumber: Number,
  player: SchemaTypes.ObjectId
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 });

const draftPickSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  player: SchemaTypes.ObjectId,
  golfer: SchemaTypes.ObjectId,
  pickNumber: Number,
  timestamp: Date
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 });
draftPickSchema.index({ tourneyId: 1, golfer: 1 });

const draftPrioritySchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  userId: String,
  golferPriority: [SchemaTypes.ObjectId] 
});
draftPrioritySchema.index({ tourneyId: 1, player: 1 });

const golferScoreSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  golfer: SchemaTypes.ObjectId,
  day: Number,
  thru: Number,
  scores: [SchemaTypes.Mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 });

const tourneySchema = mongoose.Schema({
  name: String,
  par: Number,
  lastUpdated: Date,
  sourceUrl: String
});

const appStateSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  isDraftPaused: Boolean,
  allowClock: Boolean,
  draftHasStarted: Boolean
});
appStateSchema.index({ tourneyId: 1 });

const Golfer = mongoose.model('Golfer', golferSchema);
const WGR = mongoose.model('WGR', wgrSchema);
const Player = mongoose.model('Player', playerSchema);
const DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
const DraftPick = mongoose.model('DraftPick', draftPickSchema);
const DraftPriority = mongoose.model('DraftPriority', draftPrioritySchema);
const GolferScore = mongoose.model('GolferScore', golferScoreSchema);
const GolferScoreOverrides = mongoose.model(
  'GolferScoreOverrides',
  golferScoreSchema
);
const Tourney = mongoose.model('Tourney', tourneySchema);
const AppState = mongoose.model('AppState', appStateSchema);

module.exports = {
  Golfer: Golfer,
  Player: Player,
  WGR: WGR,
  DraftPickOrder: DraftPickOrder,
  DraftPick: DraftPick,
  DraftPriority: DraftPriority,
  GolferScore: GolferScore,
  GolferScoreOverrides: GolferScoreOverrides,
  Tourney: Tourney,
  AppState: AppState
};
