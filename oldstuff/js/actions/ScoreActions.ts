import AppDispatcher from '../dispatcher/AppDispatcher';
import ScoreConstants from '../constants/ScoreConstants';

export default class ScoreActions {

  static scoreUpdate(result) {
    AppDispatcher.handleViewAction({
      actionType: ScoreConstants.SCORE_UPDATE,
      tourneyStandings: result.tourneyStandings,
      lastUpdated: result.lastUpdated
    });
  }

};
