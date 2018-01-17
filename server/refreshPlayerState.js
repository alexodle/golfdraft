'use strict';

// Refreshes users, pick order, draft picks, and chat

const _ = require('lodash');
const access = require('./access');
const config = require('./config');
const mongooseUtil = require('./mongooseUtil');
const Promise = require('promise');
const tourneyConfigReader = require('./tourneyConfigReader');
const tourneyUtils = require('./tourneyUtils');

function refreshUserState(pickOrderNames) {
  return Promise.all([
    access.clearPickOrder(),
    access.clearDraftPicks(),
    access.clearChatMessages(),
    access.clearPickLists()
  ])
  .then(function () {
    const users = _.map(pickOrderNames, function (name) {
      return { name: name };
    });
    return access.ensureUsers(users);
  })
  .then(function () {
    return access.getUsers().then(function (users) {
      return _.sortBy(users, function (p) {
        return _.indexOf(pickOrderNames, p.name);
      });
    });
  })
  .then(function (sortedUsers) {
    const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
    return access.setPickOrder(pickOrder);
  });
}

if (require.main === module) {
  mongooseUtil.connect()
    .then(function () {
      const tourneyCfg = tourneyConfigReader.loadConfig();
      return refreshUserState(tourneyCfg.draftOrder);
    })
    .then(function () {
      mongooseUtil.close();
    })
    .catch(function (err) {
      console.log(err);
    });
}

module.exports = refreshUserState;
