'use strict';

// Refreshes players, pick order, draft picks, and chat

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var mongoose = require('mongoose');
var Promise = require('promise');
var tourneyConfigReader = require('./tourneyConfigReader');
var tourneyUtils = require('./tourneyUtils');

function refreshPlayerState(pickOrderNames) {
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
    var pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers);
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
    refreshPlayerState(tourneyCfg.draftOrder).then(function () {
      process.exit(0);
    });
  });
}

module.exports = refreshPlayerState;
