'use strict';

const $ = require('jquery');
const _ = require('lodash');
const AppConstants = require('../constants/AppConstants');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const Store = require('./Store');
const UserActions = require('../actions/UserActions');

let _currentUser = null;
let _users = null;
let _isAdmin = false;
let _activeUsers = null;

const UserStore =  _.extend({}, Store.prototype, {

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
    return _.values(_users);
  },

  getActive: function () {
    return _activeUsers;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_USERS:
      _users = _.indexBy(action.users, '_id');
      UserStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      _currentUser = action.currentUser;

      if (!_currentUser || !action.doNotSync) {
        $.post('/logout')
          .done(function () {
            UserActions.setCurrentUserSynced();
          })
          .fail(function () {
            window.location.reload();
          });
      } else {
        UserActions.setCurrentUserSynced();
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
