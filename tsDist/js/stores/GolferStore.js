"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppConstants_1 = require("../constants/AppConstants");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const Store_1 = require("./Store");
let _golfers = null;
class GolferStoreImpl extends Store_1.default {
    changeEvent() { return 'GolferStore:change'; }
    getAll() { return _golfers; }
    getGolfer(id) {
        return _golfers[id];
    }
}
const GolferStore = new GolferStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case AppConstants_1.default.SET_GOLFERS:
            _golfers = _.keyBy(action.golfers, '_id');
            GolferStore.emitChange();
            break;
    }
    return true;
});
exports.default = GolferStore;
