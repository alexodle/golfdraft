'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';

const SettingsActions = {

  setAppState: function (appState) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_APP_STATE,
      appState: appState
    });
  }

};

export default SettingsActions;
