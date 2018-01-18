'use strict';

import * as _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ScoreConstants from '../constants/ScoreConstants';
import ScoreLogic from '../logic/ScoreLogic';
import Store from './Store';

// Indexed by golfer id
let _scores = {};
let _lastUpdated = null;

const ScoreStore =  _.extend({}, Store.prototype, {

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
  const action = payload.action;

  switch(action.actionType) {
    case ScoreConstants.SCORE_UPDATE:
      const scores = ScoreLogic.fillMissedCutScores(action.scores);

      _scores = _.indexBy(scores, "golfer");
      _lastUpdated = action.lastUpdated;

      ScoreStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default ScoreStore;
