import Store from './Store';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import {Tourney} from '../types/ClientTypes';

let _tourneyName: string = null;
let _allTourneys: Tourney[] = null;

class TourneyStoreImpl extends Store {
  changeEvent() { return 'TourneyStore:change'; }
  getTourneyName() { return _tourneyName; }
  getAllTourneys() { return _allTourneys; }
}
const TourneyStore = new TourneyStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_TOURNEY_NAME:
      _tourneyName = action.tourneyName;
      TourneyStore.emitChange();
      break;
      
    case AppConstants.SET_ALL_TOURNEYS:
      _allTourneys = action.allTourneys;
      TourneyStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default TourneyStore;
