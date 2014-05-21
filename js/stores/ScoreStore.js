'use strict';

var merge = require('react/lib/merge');
var _ = require('underscore');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var ScoreConstants = require('../constants/ScoreConstants');

// Indexed by golfer id
var _scores = {};
var _lastUpdated = null;

// TODO - Move to ScoreLogic
function fillMissedCutScores(scores) {
  function worstScore(day) {
    var score = _.chain(scores)
      .filter(function (s) { return s.scores[day] !== "MC"; })
      .max(function (s) { return s.scores[day]; })
      .value();
    return score.scores[day];
  }
  var worstScores = _.map(_.range(scores[0].scores.length), worstScore);
  _.each(scores, function (s) {
    s.missedCuts = _.map(s.scores, function (s) {
      return s === "MC";
    });
    s.scores = _.map(s.scores, function (s, i) {
      return s === "MC" ? worstScores[i] : s;
    });
  });
  return scores;
}

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
      var scores = fillMissedCutScores(action.scores);

      _scores = _.indexBy(scores, "golfer");
      _lastUpdated = action.lastUpdated;

      ScoreStore.emitChange();
      break;

    default:
      return true;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

// HACKHACK
require('../actions/ScoreActions').scoreUpdate({
  scores: window.golfDraftSeed.tourney.scores,
  lastUpdated: window.golfDraftSeed.tourney.lastUpdated
});

module.exports = ScoreStore;
