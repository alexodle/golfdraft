"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppConstants_1 = require("../constants/AppConstants");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const Store_1 = require("./Store");
let _appState = null;
class AppSettingsStoreImpl extends Store_1.default {
    changeEvent() { return 'AppSettingsStore:change'; }
    getIsPaused() { return _appState.isDraftPaused; }
    getAllowClock() { return _appState.allowClock; }
    getDraftHasStarted() { return _appState.draftHasStarted; }
    getAutoPickUsers() { return _appState.autoPickUsers; }
}
const AppSettingsStore = new AppSettingsStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case AppConstants_1.default.SET_APP_STATE:
            _appState = _.extend({}, action.appState, {
                autoPickUsers: _.keyBy(action.appState.autoPickUsers)
            });
            AppSettingsStore.emitChange();
            break;
    }
    return true; // No errors.  Needed by promise in Dispatcher.
});
exports.default = AppSettingsStore;
