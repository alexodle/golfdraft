'use strict';

const _ = require('lodash');
const access = require('./access');
const config = require('./config');
const mongoose = require('mongoose');
const Promise = require('promise');
const readerConfig = require('../scores_sync/readerConfig');
const tourneyConfigReader = require('./tourneyConfigReader');
const tourneyUtils = require('./tourneyUtils');
const updateScore = require('../scores_sync/updateScore');

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

function refreshData(pickOrderNames, reader, url) {
  console.log("BEGIN Refreshing all data...");
  console.log("");
  console.log("Pick order:");
  console.log(JSON.stringify(pickOrderNames));
  console.log("");
  console.log("Reader: " + reader);
  console.log("Reader URL: " + url);
  console.log("");

  printState()
  .then(function () {
    console.log("Clearing current state");
    return access.resetTourney();
  })
  .then(function () {
    console.log("Adding players");
    console.log("");
    const players = _.map(pickOrderNames, function (name) {
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
    const pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers);
    return access.setPickOrder(pickOrder);
  })
  .then(function () {
    console.log("END Refreshing all data...");
  })
  .then(printState)
  .then(function () {
    console.log("BEGIN Updating scores");
    return updateScore.run(readerConfig[reader].reader, url).then(function () {
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

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  const tourneyCfg = tourneyConfigReader.loadConfig();
  refreshData(tourneyCfg.draftOrder, tourneyCfg.scores.type, tourneyCfg.scores.url);
});
