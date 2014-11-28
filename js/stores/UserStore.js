'use strict';

var _ = require('lodash');
var $ = require('jquery');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var _currentUser = null;
var _users = null;

var UserStore =  _.extend({}, Store.prototype, {

  changeEvent: 'UserStore:change',

  getCurrentUser: function () {
    return _users[_currentUser];
  },

  getAll: function () {
    return _users;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_USERS:
      _users = action.users;
      UserStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      _currentUser = action.currentUser;

      // TODO - Move to separate server sync
      var xhr = null;
      if (_currentUser) {
        xhr = $.post('/login', UserStore.getCurrentUser());
      } else {
        xhr = $.post('/logout');
      }
      xhr.fail(function () {
        window.location.reload();
      });

      UserStore.emitChange();
      break;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = UserStore;
