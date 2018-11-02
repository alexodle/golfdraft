import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';
import {Tourney} from '../types/ClientTypes';

export default class AppActions {

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

  static setTourneyName(tourneyName: string) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_TOURNEY_NAME,
      tourneyName
    });
  }

  static setAllTourneys(allTourneys: Tourney[]) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_ALL_TOURNEYS,
      allTourneys
    });
  }

};
