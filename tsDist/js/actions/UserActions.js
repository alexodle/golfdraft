"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const AppConstants_1 = require("../constants/AppConstants");
class UserActions {
    static setCurrentUser(userId) {
        AppDispatcher_1.default.handleViewAction({
            actionType: AppConstants_1.default.CURRENT_USER_CHANGE,
            currentUser: userId
        });
    }
    static setCurrentUserSynced() {
        AppDispatcher_1.default.handleServerAction({
            actionType: AppConstants_1.default.CURRENT_USER_CHANGE_SYNCED
        });
    }
    /**
     Same as setting the current user, except that this is specifically
     reserved for app startup
     */
    static hydrateCurrentUser(userId) {
        AppDispatcher_1.default.handleServerAction({
            actionType: AppConstants_1.default.CURRENT_USER_CHANGE,
            currentUser: userId,
            doNotSync: true
        });
    }
    static setIsAdmin(isAdmin) {
        AppDispatcher_1.default.handleServerAction({
            actionType: AppConstants_1.default.SET_IS_ADMIN,
            isAdmin: isAdmin
        });
    }
    static setActiveUsers(activeUsers) {
        AppDispatcher_1.default.handleServerAction({
            actionType: AppConstants_1.default.SET_ACTIVE_USERS,
            activeUsers: activeUsers
        });
    }
}
exports.default = UserActions;
;
