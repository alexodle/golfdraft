'use strict';

 var _ = require('lodash');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var ScoreConstants = require('../constants/ScoreConstants');
var ScoreLogic = require('../logic/ScoreLogic');

// Indexed by golfer id
var _scores = {};
var _lastUpdated = null;

var ScoreStore =  _.extend({}, Store.prototype, {

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
      var scores = ScoreLogic.fillMissedCutScores(action.scores);

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
