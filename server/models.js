'use strict';

var mongoose = require('mongoose');
var SchemaTypes = mongoose.Schema.Types;

var golferSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  name: String
});
golferSchema.index({ name: 1, tourneyId: 1 });

// Keep this separate for now, that way I don't have to change it often
var wgrSchema = mongoose.Schema({
  name: String,
  wgr: Number
});
wgrSchema.index({ name: 1 });

// For now these are the same
var playerSchema = golferSchema;

var draftPickOrderSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  pickNumber: Number,
  player: SchemaTypes.ObjectId
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 });

var draftPickSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  player: SchemaTypes.ObjectId,
  golfer: SchemaTypes.ObjectId,
  pickNumber: Number,
  timestamp: Date
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 });
draftPickSchema.index({ tourneyId: 1, golfer: 1 });

var draftPrioritySchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  userId: String,
  golferPriority: [SchemaTypes.ObjectId] 
});
draftPrioritySchema.index({ tourneyId: 1, player: 1 });

var golferScoreSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  golfer: SchemaTypes.ObjectId,
  day: Number,
  thru: Number,
  scores: [SchemaTypes.Mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 });

var tourneySchema = mongoose.Schema({
  name: String,
  par: Number,
  lastUpdated: Date,
  sourceUrl: String
});

var appStateSchema = mongoose.Schema({
  tourneyId: SchemaTypes.ObjectId,
  isDraftPaused: Boolean,
  allowClock: Boolean
});
appStateSchema.index({ tourneyId: 1 });

var Golfer = mongoose.model('Golfer', golferSchema);
var WGR = mongoose.model('WGR', wgrSchema);
var Player = mongoose.model('Player', playerSchema);
var DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
var DraftPick = mongoose.model('DraftPick', draftPickSchema);
var DraftPriority = mongoose.model('DraftPriority', draftPrioritySchema);
var GolferScore = mongoose.model('GolferScore', golferScoreSchema);
var GolferScoreOverrides = mongoose.model(
  'GolferScoreOverrides',
  golferScoreSchema
);
var Tourney = mongoose.model('Tourney', tourneySchema);
var AppState = mongoose.model('AppState', appStateSchema);

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
