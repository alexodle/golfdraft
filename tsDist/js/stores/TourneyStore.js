"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = require("./Store");
const AppConstants_1 = require("../constants/AppConstants");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
let _tourneyName = null;
class TourneyStoreImpl extends Store_1.default {
    changeEvent() { return 'TourneyStore:change'; }
    getTourneyName() { return _tourneyName; }
}
const TourneyStore = new TourneyStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case AppConstants_1.default.SET_TOURNEY_NAME:
            _tourneyName = action.tourneyName;
            TourneyStore.emitChange();
            break;
    }
    return true; // No errors. Needed by promise in Dispatcher.
});
exports.default = TourneyStore;
