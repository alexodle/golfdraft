'use strict';

import * as _ from 'lodash';

import Store from './Store';
import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';

let _appState = {};

function valueOr(key, orValue) {
  return _.has(_appState, key) ? _appState[key] : orValue;
}

const AppSettingsStore =  _.extend({}, Store.prototype, {

  changeEvent: 'AppSettingsStore:change',

  getIsPaused: function () {
    return valueOr('isDraftPaused', false);
  },

  getAllowClock: function () {
    return valueOr('allowClock', true);
  },

  getDraftHasStarted: function () {
    return valueOr('draftHasStarted', false);
  },

  getAutoPickUsers: function () {
    return valueOr('autoPickUsers', {});
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_APP_STATE:
      _appState = _.extend({}, action.appState, {
        autoPickUsers: _.indexBy(action.appState.autoPickUsers)
      });
      AppSettingsStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

export default AppSettingsStore;
