'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ScoreConstants from '../constants/ScoreConstants';

const ScoreActions = {

  scoreUpdate: function (result) {
    AppDispatcher.handleViewAction({
      actionType: ScoreConstants.SCORE_UPDATE,
      scores: result.scores,
      lastUpdated: result.lastUpdated
    });
  }

};

export default ScoreActions;
