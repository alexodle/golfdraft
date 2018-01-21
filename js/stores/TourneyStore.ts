import Store from './Store';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';

let _tourneyName: string = null;

class TourneyStoreImpl extends Store {
  changeEvent() { return 'TourneyStore:change'; }
  getTourneyName() { return _tourneyName; }
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
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default TourneyStore;
