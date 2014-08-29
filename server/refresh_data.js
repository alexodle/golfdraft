'use strict';

var Promise = require('promise');
var _ = require('underscore');
var models = require('./models');
var mongoose = require('mongoose');
var config = require('./config');
var updateScore = require('./update_score');

var Tourney = models.Tourney;

mongoose.connect(config.mongo_url);

function printState() {
  return Promise.all([Tourney.findOne({_id: config.tourney_id}).exec()
  .then(function (tourney) {
    console.log("BEGIN Logging current state...");
    console.log("");
    console.log("Tourney:");
    console.log(JSON.stringify(tourney));
    console.log("");
    console.log("END Logging current state...");
    console.log("");
  })]);
}

function refreshData(pickOrderNames, yahooUrl) {
  console.log("BEGIN Refreshing all data...");
  console.log("");
  console.log("Pick order:");
  console.log(JSON.stringify(pickOrderNames));
  console.log("");
  console.log("Yahoo URL: " + yahooUrl);
  console.log("");

  printState()
  .then(function () {
    console.log("Clearing current state");
    return Tourney.update({_id: config.tourney_id}, {$set: {
      players: [],
      golfers: [],
      draft: {},
      scores: [],
      scoreOverrides: [],
      par: -1,
      yahooUrl: yahooUrl
    }}).exec();
  })
  .then(function () {
    console.log("Adding players");
    console.log("");
    var players = _.map(pickOrderNames, function (name) {
      return {name: name};
    });
    return Tourney.update({_id: config.tourney_id}, {$set: {
      players: players,

      // TEMP TEMP HIHI
      golfers: _.map(
        ["Tiger Woods", "Phil Mickelson", "Padraig Harrington", "Kevin Na", "Sergio Garcia"], function (name) { return { name: name }; })
    }}).exec();
  })
  .then(function () {
    return Tourney.findOne({_id: config.tourney_id}).exec().then(function (r) {
      return _.sortBy(r.players, function (p) {
        return _.indexOf(pickOrderNames, p.name);
      });
    });
  })
  .then(function (players) {
    console.log("Updating pickOrder");
    var ps = players;
    var rps = _.clone(ps).reverse();
    var pickOrder = _.flatten([ps, rps, ps, rps]);
    return Tourney.update({_id: config.tourney_id}, {$set: {
      draft: {
        pickOrder: _.pluck(pickOrder, "_id"),
        picks: []
      }
    }}).exec();
  })
  .then(function () {
    console.log("END Refreshing all data...");
  })
  .then(printState)
  .then(function () {
    console.log("BEGIN Updating scores");
    return updateScore.run().then(function () {
      console.log("END Updating scores");
    });
  })
  .catch(function (err) {
    if (err.stack) {
      console.log(err.stack);
    } else {
      console.log(err);
    }
  })
  .then(function () {
    process.exit(0);
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  refreshData([
    'Alex O',
  ], 'http://sports.yahoo.com/golf/pga/leaderboard');
});
