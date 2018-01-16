// @flow
'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');

const SettingsActions = {

  setAppState: function (appState) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_APP_STATE,
      appState: appState
    });
  }

};

module.exports = SettingsActions;
