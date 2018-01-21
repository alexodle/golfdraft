import * as _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ScoreConstants from '../constants/ScoreConstants';
import ScoreLogic from '../logic/ScoreLogic';
import Store from './Store';
import {GolferScore} from '../types/Types';

let _scores: {[golferId: string]: GolferScore} = {};
let _lastUpdated: Date = null;

class ScoreStoreImpl extends Store {
  changeEvent() { return 'ScoreStore:change'; }
  getScores() { return _scores; }
  getLastUpdated() { return _lastUpdated; }
}
const ScoreStore = new ScoreStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case ScoreConstants.SCORE_UPDATE:
      const scores = ScoreLogic.fillMissedCutScores(action.scores);

      _scores = _.keyBy(scores, "golfer");
      _lastUpdated = action.lastUpdated;

      ScoreStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default ScoreStore;
