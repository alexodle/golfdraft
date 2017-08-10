'use strict';

var _ = require('lodash');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var ScoreConstants = require('../constants/ScoreConstants');
var ScoreLogic = require('../logic/ScoreLogic');
var Store = require('./Store');

// Indexed by golfer id
var _scores = {};
var _lastUpdated = null;
var _numDays = 0;
var _startDay = 0;
var _perDay = 0;

var ScoreStore =  _.extend({}, Store.prototype, {

  changeEvent: 'ScoreStore:change',

  getScores: function () {
    return _scores;
  },

  getLastUpdated: function () {
    return _lastUpdated;
  },

  getNumberOfDays: function() {
    return _numDays;
  },

  getStartDay: function() {
    return _startDay;
  },

  getScoresPerDay: function() {
    return _perDay;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case ScoreConstants.SCORE_UPDATE:
      _lastUpdated = action.lastUpdated;
      _startDay = action.startDay;
      _numDays = action.numDays;
      _perDay = action.scoresPerDay;

      var scores = ScoreLogic.fillMissedCutScores(action.scores,_startDay, _numDays);

      _scores = _.indexBy(scores, "golfer");

      ScoreStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

module.exports = ScoreStore;
