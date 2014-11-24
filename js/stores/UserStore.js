'use strict';

var _ = require('lodash');
var $ = require('jquery');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var _currentUser = null;
var _users = {};

var UserStore =  _.extend({}, Store.prototype, {

  changeEvent: 'UserStore:change',

  getCurrentUser: function () {
    return _users[_currentUser];
  },

  getAll: function () {
    return _.clone(_users);
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
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

    default:
      return true;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

// HACKHACK - For now users are just wrappers around players
var PlayerStore = require('./PlayerStore');
_users = _.transform(PlayerStore.getAll(), function (memo, p) {
  var uid = 'user_' + p.id;
  memo[uid] = { id: uid, name: p.name, player: p.id };
});

// HACKHACK
_currentUser = (window.golfDraftSeed.user || {}).id;

module.exports = UserStore;
