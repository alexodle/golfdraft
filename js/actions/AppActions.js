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

  setTourney: function (tourney) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_TOURNEY,
      tourney: tourney
    });
  }

};

module.exports = AppActions;
