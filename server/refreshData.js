'use strict';

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var mongoose = require('mongoose');
var Promise = require('promise');
var tourneyUtils = require('./tourneyUtils');
var updateScore = require('./updateScore');

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function printState() {
  return access.getTourney().then(function (tourney) {
    console.log("BEGIN Logging current state...");
    console.log("");
    console.log("Tourney:");
    console.log(JSON.stringify(tourney));
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
    return access.resetTourney();
  })
  .then(function () {
    console.log("Adding players");
    console.log("");
    var players = _.map(pickOrderNames, function (name) {
      return {name: name};
    });
    return access.ensurePlayers(players);
  })
  .then(function () {
    return access.getPlayers().then(function (players) {
      return _.sortBy(players, function (p) {
        return _.indexOf(pickOrderNames, p.name);
      });
    });
  })
  .then(function (sortedPlayers) {
    console.log("Updating pickOrder");
    var pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers);
    return access.setPickOrder(pickOrder);
  })
  .then(function () {
    console.log("END Refreshing all data...");
  })
  .then(printState)
  .then(function () {
    console.log("BEGIN Updating scores");
    return updateScore.run(yahooUrl).then(function () {
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
    'Alex O', 'Bobby G'
  ], 'http://sports.yahoo.com/golf/pga/leaderboard/2015/360');
});
