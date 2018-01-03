'use strict';

const _ = require('lodash');
const AppConstants = require('../constants/AppConstants');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const Store = require('./Store');

let _players = {};

const PlayerStore =  _.extend({}, Store.prototype, {

  changeEvent: 'PlayerStore:change',

  getPlayer: function (id) {
    return _players[id];
  },

  getAll: function () {
    return _players;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_PLAYERS:
      _players = _.indexBy(action.players, 'id');
      PlayerStore.emitChange();
      break;
  }
});

module.exports = PlayerStore;
