'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');

const SettingsActions = {

  setPlaySounds: function (playSounds) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_PLAY_SOUNDS,
      playSounds: playSounds
    });
  },

  setIsPaused: function (isPaused) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_IS_PAUSED,
      isPaused: isPaused
    });
  },

  setAllowClock: function (allowClock) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_ALLOW_CLOCK,
      allowClock: allowClock
    });
  },

};

module.exports = SettingsActions;
