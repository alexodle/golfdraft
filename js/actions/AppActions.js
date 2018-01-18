'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';

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

export default AppActions;
