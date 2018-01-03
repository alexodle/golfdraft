'use strict';

// Refreshes players, pick order, draft picks, and chat

const _ = require('lodash');
const access = require('./access');
const config = require('./config');
const mongoose = require('mongoose');
const Promise = require('promise');
const tourneyConfigReader = require('./tourneyConfigReader');
const tourneyUtils = require('./tourneyUtils');

function refreshPlayerState(pickOrderNames) {
  return Promise.all([
    access.clearPlayers(),
    access.clearPickOrder(),
    access.clearDraftPicks(),
    access.clearChatMessages()
  ])
  .then(function () {
    const players = _.map(pickOrderNames, function (name) {
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
    const pickOrder = tourneyUtils.snakeDraftOrder(sortedPlayers);
    return access.setPickOrder(pickOrder);
  });
}

if (require.main === module) {
  mongoose.set('debug', true);
  mongoose.connect(config.mongo_url);

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {
    const tourneyCfg = tourneyConfigReader.loadConfig();
    refreshPlayerState(tourneyCfg.draftOrder).then(function () {
      process.exit(0);
    });
  });
}

module.exports = refreshPlayerState;
