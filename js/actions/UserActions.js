// @flow
'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');

const UserActions = {

  setCurrentUser: function (user) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.CURRENT_USER_CHANGE,
      currentUser: user
    });
  },

  setCurrentUserSynced: function () {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.CURRENT_USER_CHANGE_SYNCED
    });
  },

  /**
   Same as setting the current user, except that this is specifically
   reserved for app startup
   */
  hydrateCurrentUser: function (user) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.CURRENT_USER_CHANGE,
      currentUser: user,
      doNotSync: true
    });
  },

  setIsAdmin: function (isAdmin) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_IS_ADMIN,
      isAdmin: isAdmin
    });
  },

  setActiveUsers: function (activeUsers) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_ACTIVE_USERS,
      activeUsers: activeUsers
    });
  }

};

module.exports = UserActions;
