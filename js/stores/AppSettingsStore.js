'use strict';

var _ = require('lodash');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var _playSounds = true;

var AppSettingsStore =  _.extend({}, Store.prototype, {

  changeEvent: 'AppSettingsStore:change',

  getPlaySounds: function () {
    return _playSounds;
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

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = AppSettingsStore;
