'use strict';

var mongoose = require('mongoose');

var golferSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
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
  tourneyId: mongoose.Schema.ObjectId,
  pickNumber: Number,
  player: mongoose.Schema.ObjectId
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 });

var draftPickSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  player: mongoose.Schema.ObjectId,
  golfer: mongoose.Schema.ObjectId,
  pickNumber: Number
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 });
draftPickSchema.index({ tourneyId: 1, golfer: 1 });

var golferScoreSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  golfer: mongoose.Schema.ObjectId,
  day: Number,
  scores: [mongoose.Schema.mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 });

var tourneySchema = mongoose.Schema({
  name: String,
  par: Number,
  lastUpdated: Date,
  yahooUrl: String
});

var appStateSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  isDraftPaused: Boolean
});
appStateSchema.index({ tourneyId: 1 });

var Golfer = mongoose.model('Golfer', golferSchema);
var WGR = mongoose.model('WGR', wgrSchema);
var Player = mongoose.model('Player', playerSchema);
var DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
var DraftPick = mongoose.model('DraftPick', draftPickSchema);
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
  GolferScore: GolferScore,
  GolferScoreOverrides: GolferScoreOverrides,
  Tourney: Tourney,
  AppState: AppState
};
