// @flow
'use strict';

const _ = require('lodash');
const AppConstants = require('../constants/AppConstants');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const Store = require('./Store');

let _golfers = {};

const GolferStore =  _.extend({}, Store.prototype, {

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
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_GOLFERS:
      _golfers = _.indexBy(action.golfers, '_id');
      GolferStore.emitChange();
      break;
  }
});

module.exports = GolferStore;
