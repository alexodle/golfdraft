import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';
import {Indexed} from '../types/ClientTypes';

export default class UserActions {

  static setCurrentUser(userId: string) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.CURRENT_USER_CHANGE,
      currentUser: userId
    });
  }

  static setCurrentUserSynced() {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.CURRENT_USER_CHANGE_SYNCED
    });
  }

  /**
   Same as setting the current user, except that this is specifically
   reserved for app startup
   */
  static hydrateCurrentUser(userId: string) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.CURRENT_USER_CHANGE,
      currentUser: userId,
      doNotSync: true
    });
  }

  static setIsAdmin(isAdmin: boolean) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_IS_ADMIN,
      isAdmin,
    });
  }

  static setActiveUsers(activeUsers: string[]) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_ACTIVE_USERS,
      activeUsers,
    });
  }

  static setPickListUsers(pickListUsers: string[]) {
    AppDispatcher.handleServerAction({
      actionType: AppConstants.SET_PICKLIST_USERS,
      pickListUsers,
    });
  }

};
