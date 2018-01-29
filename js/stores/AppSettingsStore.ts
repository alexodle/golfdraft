import * as _ from 'lodash';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import Store from './Store';
import {AppSettings} from '../types/ClientTypes';

let _appState: AppSettings = null;

class AppSettingsStoreImpl extends Store {
  changeEvent() { return 'AppSettingsStore:change'; }
  getIsPaused() { return _appState.isDraftPaused; }
  getAllowClock() { return _appState.allowClock; }
  getDraftHasStarted() { return _appState.draftHasStarted; }
  getAutoPickUsers() { return _appState.autoPickUsers; }
}
const AppSettingsStore = new AppSettingsStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_APP_STATE:
      _appState = _.extend({}, action.appState, {
        autoPickUsers: _.keyBy(action.appState.autoPickUsers)
      });
      AppSettingsStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

export default AppSettingsStore;
