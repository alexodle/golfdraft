"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const ScoreConstants_1 = require("../constants/ScoreConstants");
const ScoreLogic_1 = require("../logic/ScoreLogic");
const Store_1 = require("./Store");
let _scores = {};
let _lastUpdated = null;
class ScoreStoreImpl extends Store_1.default {
    changeEvent() { return 'ScoreStore:change'; }
    getScores() { return _scores; }
    getLastUpdated() { return _lastUpdated; }
}
const ScoreStore = new ScoreStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case ScoreConstants_1.default.SCORE_UPDATE:
            const scores = ScoreLogic_1.default.fillMissedCutScores(action.scores);
            _scores = _.keyBy(scores, "golfer");
            _lastUpdated = action.lastUpdated;
            ScoreStore.emitChange();
            break;
    }
    return true; // No errors. Needed by promise in Dispatcher.
});
exports.default = ScoreStore;
