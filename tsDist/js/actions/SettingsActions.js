"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const AppConstants_1 = require("../constants/AppConstants");
class SettingsActions {
    static setAppState(appState) {
        AppDispatcher_1.default.handleViewAction({
            actionType: AppConstants_1.default.SET_APP_STATE,
            appState: appState
        });
    }
}
exports.default = SettingsActions;
;
