'use strict';

var _ = require('lodash');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var Store = require('./Store');

var _players = {};

var PlayerStore =  _.extend({}, Store.prototype, {

  changeEvent: 'PlayerStore:change',

  getPlayer: function (id) {
    return _players[id];
  },

  getAll: function () {
    return _.clone(_players);
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_PLAYERS:
      _players = _.indexBy(action.players, 'id');
      PlayerStore.emitChange();
      break;
  }
});

module.exports = PlayerStore;
