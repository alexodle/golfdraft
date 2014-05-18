'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var UserActions = {

  setCurrentUser: function (user) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.CURRENT_USER_CHANGE,
      currentUser: user
    });
  }

};

module.exports = UserActions;
