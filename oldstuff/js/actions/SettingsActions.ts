import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';

export default class SettingsActions {

  static setAppState(appState) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_APP_STATE,
      appState: appState
    });
  }

};
