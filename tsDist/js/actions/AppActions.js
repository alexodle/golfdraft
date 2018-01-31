"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const AppConstants_1 = require("../constants/AppConstants");
class AppActions {
    static setGolfers(golfers) {
        AppDispatcher_1.default.handleViewAction({
            actionType: AppConstants_1.default.SET_GOLFERS,
            golfers: golfers
        });
    }
    static setUsers(users) {
        AppDispatcher_1.default.handleViewAction({
            actionType: AppConstants_1.default.SET_USERS,
            users: users
        });
    }
    static setTourneyName(tourneyName) {
        AppDispatcher_1.default.handleViewAction({
            actionType: AppConstants_1.default.SET_TOURNEY_NAME,
            tourneyName: tourneyName
        });
    }
}
exports.default = AppActions;
;
