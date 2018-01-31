"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const ScoreConstants_1 = require("../constants/ScoreConstants");
class ScoreActions {
    static scoreUpdate(result) {
        AppDispatcher_1.default.handleViewAction({
            actionType: ScoreConstants_1.default.SCORE_UPDATE,
            scores: result.scores,
            lastUpdated: result.lastUpdated
        });
    }
}
exports.default = ScoreActions;
;
