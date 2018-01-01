'use strict';

var $ = require('jquery');
var _ = require('lodash');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var Store = require('./Store');
var UserActions = require('../actions/UserActions');

var _currentUser = null;
var _users = null;
var _isAdmin = false;
var _activeUsers = null;

var UserStore =  _.extend({}, Store.prototype, {

  changeEvent: 'UserStore:change',

  getCurrentUser: function () {
    return _users[_currentUser];
  },

  getUser: function (user) {
    return _users[user];
  },

  getUserByName: function (name) {
    return _.find(_users, { name: name });
  },

  isAdmin: function () {
    return _isAdmin;
  },

  getAll: function () {
    return _users;
  },

  getActive: function () {
    return _activeUsers;
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

      if (!action.doNotSync) {
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
        xhr.done(function () {
          UserActions.setCurrentUserSynced();
        });
      }

      UserStore.emitChange();
      break;

    case AppConstants.SET_IS_ADMIN:
      _isAdmin = action.isAdmin;
      UserStore.emitChange();
      break;

    case AppConstants.SET_ACTIVE_USERS:
      _activeUsers = action.activeUsers;
      UserStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = UserStore;
