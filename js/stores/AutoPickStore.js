'use strict';

var _ = require('lodash');
var AppConstants = require('../constants/AppConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var GolferStore = require('./GolferStore');
var Store = require('./Store');
var UserStore = require('./UserStore');

var _autoPickOrder = null;
var _autoPickUser = null;
var _isAutoPick = false;

var AutoPickStore =  _.extend({}, Store.prototype, {

  changeEvent: 'AutoPickStore:change',

  getIsAutoPick: function () {
    return _isAutoPick;
  },

  getAutoPickOrder: function () {
    return _autoPickOrder;
  }

});

function initializeAutoPickOrder() {
  _autoPickOrder = _.sortBy(GolferStore.getAll(), 'wgr');
}

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_AUTO_PICK_ORDER:
      _autoPickOrder = action.autoPickOrder;
      AutoPickStore.emitChange();
      break;

    case AppConstants.SET_IS_AUTO_PICK:
      _isAutoPick = action.isAutoPick;
      AutoPickStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      var newUser = UserStore.getCurrentUser();
      if (newUser !== _autoPickUser) {
        _autoPickUser = newUser;
        _isAutoPick = false;
        initializeAutoPickOrder();

        AutoPickStore.emitChange();
      }
      break;
  }

});

module.exports = AutoPickStore;
