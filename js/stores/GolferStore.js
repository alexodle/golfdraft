'use strict';

var _ = require('lodash');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var Store = require('./Store');

var _golfers = {};

var GolferStore =  _.extend({}, Store.prototype, {

  changeEvent: 'GolferStore:change',

  getAll: function () {
    return _golfers;
  },

  getGolfer: function (id) {
    return _golfers[id];
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_GOLFERS:
      _golfers = _.indexBy(action.golfers, 'id');
      GolferStore.emitChange();
      break;
  }
});

module.exports = GolferStore;
