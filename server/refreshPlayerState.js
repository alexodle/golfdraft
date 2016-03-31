'use strict';

// Refreshes players, pick order, draft picks, and chat

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var mongoose = require('mongoose');
var poolPlayerConfig = require('../poolPlayerConfig');
var Promise = require('promise');
var tourneyUtils = require('./tourneyUtils');

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

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
  })
  .then(function () {
    process.exit(0);
  })
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  refreshPlayerState(poolPlayerConfig.draftOrder);
});
