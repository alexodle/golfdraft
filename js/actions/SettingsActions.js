'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var SettingsActions = {

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
  }

};

module.exports = SettingsActions;
