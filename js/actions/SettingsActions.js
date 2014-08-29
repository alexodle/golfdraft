'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var SettingsActions = {

  setPlaySounds: function (playSounds) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_PLAY_SOUNDS,
      playSounds: playSounds
    });
  }

};

module.exports = SettingsActions;
