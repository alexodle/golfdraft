'use strict';

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var mongoose = require('mongoose');
var Promise = require('promise');
var tourneyConfigReader = require('./tourneyConfigReader');
var tourneyUtils = require('./tourneyUtils');
var utils = require('../common/utils');
var updateScore = require('../scores_sync/updateScore');
var opt = require('node-getopt').create([
  ['i','init','Initializes a new Tourney'],
  ['s','save','Writes change back to the tourney_cfg file'],
  ['c','clone=','Clones and writes changes to a new tourney_cfg file']
]).parseSystem();

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

function refreshData(tourneyCfg) {
  var pickOrderNames = tourneyCfg.draftOrder;
  var reader = tourneyCfg.scores.type;
  var url = tourneyCfg.scores.url;
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
    return access.resetTourney(tourneyCfg.tourney_id);
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
    var pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers, tourneyCfg.draftRounds);
    return access.setPickOrder(pickOrder);
  })
  .then(function () {
    console.log("END Refreshing all data...");
  })
  .then(printState)
  .then(function () {
    console.log("BEGIN Updating scores");
    return updateScore.run(reader, url).then(function () {
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
    if (opt.options.init) {
      console.log("Initialized new tourney.");
      console.log("TOURNEY_CFG=" + process.env.TOURNEY_CFG + " TOURNEY_ID="+ tourneyCfg.tourney_id);
      console.log("Draft Order: " + tourneyCfg.draftOrder);
      if(opt.options.save) {
        tourneyCfg.save();
        console.log("Updated config file with tourney_id and draftOrder.");
      }
      if (opt.options.clone) {
        tourneyCfg.save(opt.options.clone);
        console.log("Cloned config file with tourney_id and draftOrder.");
      }
    }
    process.exit(0);
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  var tourneyCfg = tourneyConfigReader.loadConfig();
  if (opt.options.init)
  {
    // initialize a new tourney
    tourneyCfg.tourney_id = mongoose.Types.ObjectId().toHexString();
    tourneyCfg.draftOrder = _.shuffle(tourneyCfg.draftOrder);
  }
  refreshData(tourneyCfg);
});
