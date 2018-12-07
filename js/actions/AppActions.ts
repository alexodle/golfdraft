import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';
import {Tourney} from '../types/ClientTypes';

export default class AppActions {

  static setActiveTourneyId(activeTourneyId) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_ACTIVE_TOURNEY_ID,
      activeTourneyId
    });
  }

  static setGolfers(golfers) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_GOLFERS,
      golfers
    });
  }

  static setUsers(users) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_USERS,
      users
    });
  }

  static setCurrentTourney(tourney: Tourney) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_CURRENT_TOURNEY,
      tourney
    });
  }

  static setAllTourneys(allTourneys: Tourney[]) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_ALL_TOURNEYS,
      allTourneys
    });
  }

};
