'use strict';

const _ = require('lodash');

const Store = require('./Store');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');

let _playSounds = true;
let _isPaused = false;
let _allowClock = true;

const AppSettingsStore =  _.extend({}, Store.prototype, {

  changeEvent: 'AppSettingsStore:change',

  getPlaySounds: function () {
    return _playSounds;
  },

  getIsPaused: function () {
    return _isPaused;
  },

  getAllowClock: function () {
    return _allowClock;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_PLAY_SOUNDS:
      _playSounds = action.playSounds;
      AppSettingsStore.emitChange();
      break;

    case AppConstants.SET_IS_PAUSED:
      _isPaused = action.isPaused;
      AppSettingsStore.emitChange();
      break;

    case AppConstants.SET_ALLOW_CLOCK:
      _allowClock = action.allowClock;
      AppSettingsStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = AppSettingsStore;
