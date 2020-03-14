import * as _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ScoreConstants from '../constants/ScoreConstants';
import Store from './Store';
import {TourneyStandings} from '../types/ClientTypes';

let _tourneyStandings: TourneyStandings = null;
let _lastUpdated: Date = null;

class ScoreStoreImpl extends Store {
  changeEvent() { return 'ScoreStore:change'; }
  getTourneyStandings() { return _tourneyStandings; }
  getLastUpdated() { return _lastUpdated; }
}
const ScoreStore = new ScoreStoreImpl();

// Register to handle all updates
AppDispatcher.register(payload => {
  const action = payload.action;

  switch(action.actionType) {
    case ScoreConstants.SCORE_UPDATE:
      // Sort the dayScores, that's it
      const tourneyStandings = action.tourneyStandings as TourneyStandings;
      const sortedTourneyStandings = { ...tourneyStandings,
        // Assume a worst score of even means the day hasn't started
        worstScoresForDay: _.chain(tourneyStandings.worstScoresForDay)
          .sortBy(ws => ws.day)
          .takeWhile(ws => ws.score != 0)
          .value(),
        playerScores: _.sortBy(tourneyStandings.playerScores, ps => ps.totalScore)
      };
      _tourneyStandings = sortedTourneyStandings;
      _lastUpdated = action.lastUpdated;

      ScoreStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default ScoreStore;
