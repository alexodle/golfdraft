'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');

const AppActions = {

  setGolfers: function (golfers) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_GOLFERS,
      golfers: golfers
    });
  },

  setUsers: function (users) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_USERS,
      users: users
    });
  },

  setTourneyName: function (tourneyName) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_TOURNEY_NAME,
      tourneyName: tourneyName
    });
  }

};

module.exports = AppActions;
