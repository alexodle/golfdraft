'use strict';

var _ = require('lodash');
var Store = require('./Store');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');

var _tourneyName = null;
var _numDays = 0;
var _scoresPerDay = 0;

var TourneyStore =  _.extend({}, Store.prototype, {

  getTourneyName: function () {
    return _tourneyName;
  },
  getNumberOfDays: function() {
    return _numDays;
  },
  getScoresPerDay: function() {
    return _scoresPerDay;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_TOURNEY:
      _tourneyName = action.tourneyCfg.name;
      _numDays = action.tourneyCfg.numDays;
      _scoresPerDay = action.tourneyCfg.scores.perDay;
      TourneyStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

module.exports = TourneyStore;
