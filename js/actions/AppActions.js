'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var AppActions = {

  setGolfers: function (golfers) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_GOLFERS,
      golfers: golfers
    });
  },

  setPlayers: function (players) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_PLAYERS,
      players: players
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
