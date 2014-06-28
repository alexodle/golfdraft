'use strict';

var Promise = require('promise');
var _ = require('underscore');
var models = require('./models');
var mongoose = require('mongoose');
var config = require('./config');
var updateScore = require('./update_score');

var Golfer = models.Golfer;
var Player = models.Player;
var Draft = models.Draft;
var Tourney = models.Tourney;

mongoose.connect(config.mongo_url);

function printState() {
  return Promise.all([
    Golfer.find().exec(),
    Player.find().exec(),
    Tourney.findOne({_id: config.tourney_id}).exec(),
    Draft.findOne({_id: config.draft_id}).exec()
  ])
  .then(function (r) {
    var golfers = r[0];
    var players = r[1];
    var tourney = r[2];
    var draft = r[3];
    console.log("BEGIN Logging current state...");
    console.log("");
    console.log("Golfers:");
    console.log(JSON.stringify(golfers));
    console.log("");
    console.log("Players:");
    console.log(JSON.stringify(players));
    console.log("");
    console.log("Tourney:");
    console.log(JSON.stringify(tourney));
    console.log("");
    console.log("Draft:");
    console.log(JSON.stringify(draft));
    console.log("");
    console.log("END Logging current state...");
    console.log("");
  });
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
    return Promise.all([
      Golfer.remove().exec(),
      Player.remove().exec(),
      Draft.update({_id: config.draft_id}, {$set: {
        pickOrder: [],
        picks: []
      }}).exec(),
      Tourney.update({_id: config.tourney_id}, {$set: {
        scores: [],
        scoreOverrides: [],
        par: -1,
        yahooUrl: yahooUrl
      }}).exec()
    ]);
  })
  .then(function () {
    console.log("Adding players");
    console.log("");
    var players = _.map(pickOrderNames, function (name) {
      return {name: name};
    });
    return Player.create(players);
  })
  .then(function () {
    return Player.find().exec().then(function (r) {
      return _.sortBy(r, function (p) {
        return _.indexOf(pickOrderNames, p.name);
      });
    });
  })
  .then(function (players) {
    console.log("Updating pickOrder");
    var ps = players;
    var rps = _.clone(ps).reverse();
    var pickOrder = _.flatten([ps, rps, ps, rps]);
    return Draft.update({_id: config.draft_id}, {$set: {
      pickOrder: _.pluck(pickOrder, "_id"),
      picks: []
    }}).exec();
  })
  .then(function () {
    console.log("END Refreshing all data...");
  })
  .then(printState)
  .then(function () {
    console.log("BEGIN Updating scores")
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
    'Johnny H',
    'Billy B',
    'Bobby C',
    'Rachel D',
    'Jimmy A'
  ], 'http://sports.yahoo.com/golf/pga/leaderboard');
});
