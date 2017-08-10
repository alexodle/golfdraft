'use strict';

// Refreshes players, pick order, draft picks, and chat

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var mongoose = require('mongoose');
var Promise = require('promise');
var tourneyConfigReader = require('./tourneyConfigReader');
var tourneyUtils = require('./tourneyUtils');
var utils = require('../common/utils');

function refreshPlayerState(tourneyCfg) {
  var pickOrderNames = tourneyCfg.draftOrder;
  return Promise.all([
    access.clearPlayers(),
    access.clearPickOrder(),
    access.clearDraftPicks(),
    access.clearChatMessages()
  ])
  .then(function () {
    var players = _.map(pickOrderNames, function (name) {
      return { name: name };
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
    var pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers, tourneyCfg.draftRounds);
    return access.setPickOrder(pickOrder);
  });
}

if (require.main === module) {
  mongoose.set('debug', true);
  mongoose.connect(config.mongo_url);

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {
    var tourneyCfg = tourneyConfigReader.loadConfig();
    if (process.argv.length > 2)
    {
      // initialize a new tourney
      tourneyCfg.draftOrder = utils.shuffle(tourneyCfg.draftOrder);
      tourneyCfg.initialized = true;
    }

    refreshPlayerState(tourneyCfg).then(function () {
      process.exit(0);
    });
  });
}

module.exports = refreshPlayerState;
