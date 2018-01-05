'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const ScoreConstants = require('../constants/ScoreConstants');

const ScoreActions = {

  scoreUpdate: function (result) {
    AppDispatcher.handleViewAction({
      actionType: ScoreConstants.SCORE_UPDATE,
      scores: result.scores,
      lastUpdated: result.lastUpdated
    });
  }

};

module.exports = ScoreActions;
