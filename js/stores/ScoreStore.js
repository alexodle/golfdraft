'use strict';

var merge = require('react/lib/merge');
var _ = require('underscore');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var ScoreConstants = require('../constants/ScoreConstants');

// Indexed by golfer id
var _scores = {};
var _lastUpdated = null;

var Score = function (spec) {
  this.golfer = spec.golfer;
  this.day = spec.day;
  this.scores = spec.scores;
};
_.extend(Score.prototype, {

  totalScore: function () {
    return _.chain(this.scores)
      .reduce(function (n, s) {
        return n + s;
      }, 0)
      .value();
  }

});

var ScoreStore = merge(Store.prototype, {

  changeEvent: 'ScoreStore:change',

  getScores: function () {
    return _scores;
  },

  getLastUpdated: function () {
    return _lastUpdated;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case ScoreConstants.SCORE_UPDATE:
      _scores = _.indexBy(action.scores, "golfer");
      _lastUpdated = action.lastUpdated;
      ScoreStore.emitChange();
      break;

    default:
      return true;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

// HACKHACK
_scores = _.indexBy(window.golfDraftSeed.tourney.scores, "golfer");
_lastUpdated = window.golfDraftSeed.tourney.lastUpdated;

// TEMPTEMP
window.scores = _scores;

module.exports = ScoreStore;
