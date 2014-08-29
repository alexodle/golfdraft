'use strict';

var mongoose = require('mongoose');

var golferSchema = mongoose.Schema({
  name: String
});

var playerSchema = mongoose.Schema({
  name: String
});

var tourneySchema = mongoose.Schema({
  players: [playerSchema],
  golfers: [golferSchema],
  draft: {
    pickOrder: [mongoose.Schema.ObjectId],
    picks: [{
      player: mongoose.Schema.ObjectId,
      golfer: mongoose.Schema.ObjectId,
      pickNumber: Number
    }]
  },
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
  name: String,
  par: Number,
  lastUpdated: Date,
  yahooUrl: String
});

var Tourney = mongoose.model('Tourney', tourneySchema);

module.exports = {
  Tourney: Tourney
};
