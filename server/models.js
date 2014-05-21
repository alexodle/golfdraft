'use strict';

var mongoose = require('mongoose');

var golferSchema = mongoose.Schema({
  name: String
});

var playerSchema = mongoose.Schema({
  name: String
});

var draftSchema = mongoose.Schema({
  pickOrder: [mongoose.Schema.ObjectId],
  picks: [{
    player: mongoose.Schema.ObjectId,
    golfer: mongoose.Schema.ObjectId,
    pickNumber: Number
  }]
});

var tourneySchema = mongoose.Schema({
  scores: [{
    golfer: mongoose.Schema.ObjectId,
    day: Number,
    scores: [mongoose.Schema.mixed]
  }],
  scoreOverrides: [{
    golfer: mongoose.Schema.ObjectId,
    day: Number,
    scores: [mongoose.Schema.mixed]
  }],
  par: Number,
  lastUpdated: Date
});

var Golfer = mongoose.model('Golfer', golferSchema);
var Player = mongoose.model('Player', playerSchema);
var Draft = mongoose.model('Draft', draftSchema);
var Tourney = mongoose.model('Tourney', tourneySchema);

module.exports = {
  Golfer: Golfer,
  Player: Player,
  Draft: Draft,
  Tourney: Tourney
};
