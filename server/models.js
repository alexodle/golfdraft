'use strict';

var mongoose = require('mongoose');

var golferSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  name: String
});
golferSchema.index({ name: 1, tourneyId: 1 });

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

var Golfer = mongoose.model('Golfer', golferSchema);
var Player = mongoose.model('Player', playerSchema);
var DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
var DraftPick = mongoose.model('DraftPick', draftPickSchema);
var GolferScore = mongoose.model('GolferScore', golferScoreSchema);
var GolferScoreOverrides = mongoose.model(
  'GolferScoreOverrides',
  golferScoreSchema
);
var Tourney = mongoose.model('Tourney', tourneySchema);

module.exports = {
  Golfer: Golfer,
  Player: Player,
  DraftPickOrder: DraftPickOrder,
  DraftPick: DraftPick,
  GolferScore: GolferScore,
  GolferScoreOverrides: GolferScoreOverrides,
  Tourney: Tourney
};
