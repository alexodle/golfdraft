'use strict';

var _ = require('lodash');
var Store = require('./Store');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');

var _tourneyName = null;
var _cfg = null;
var _state = null;

var TourneyStore =  _.extend({}, Store.prototype, {

  getTourneyName: function () {
    return _tourneyName;
  },
  getNumberOfDraftRounds: function() {
    return _cfg.draftRounds;
  },
  getRefreshRate: function() {
    return _cfg.scores.refreshRate;
  },
  getState: function() {
    return _.extend({},_state);
  },
  getConfig: function() {
    return _.extend({},_cfg);
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_TOURNEY:
      _cfg = action.tourney.cfg;
      _state = action.tourney.state;
      _tourneyName = [_state.year,
          _state.name,
        ].join(' ');
      TourneyStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

module.exports = TourneyStore;
