'use strict';

var _ = require('lodash');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var _playSounds = true;
var _isPaused = false;

var AppSettingsStore =  _.extend({}, Store.prototype, {

  changeEvent: 'AppSettingsStore:change',

  getPlaySounds: function () {
    return _playSounds;
  },

  getIsPaused: function () {
    return _isPaused;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_PLAY_SOUNDS:
      _playSounds = action.playSounds;
      AppSettingsStore.emitChange();
      break;

    case AppConstants.SET_IS_PAUSED:
      _isPaused = action.isPaused;
      AppSettingsStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = AppSettingsStore;
