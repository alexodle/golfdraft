'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var ScoreConstants = require('../constants/ScoreConstants');

var ScoreActions = {

  scoreUpdate: function (result) {
    AppDispatcher.handleViewAction({
      actionType: ScoreConstants.SCORE_UPDATE,
      scores: result.scores,
      lastUpdated: result.lastUpdated
    });
  }

};

module.exports = ScoreActions;
