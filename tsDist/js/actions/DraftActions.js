"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const DraftConstants_1 = require("../constants/DraftConstants");
class DraftActions {
    static makePick(golferId) {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.DRAFT_PICK,
            golfer: golferId
        });
    }
    static makePickListPick() {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.DRAFT_PICK_HIGHEST_PRI
        });
    }
    static draftUpdate(draft) {
        AppDispatcher_1.default.handleServerAction({
            actionType: DraftConstants_1.default.DRAFT_UPDATE,
            draft: draft
        });
    }
    static draftForUser(userId) {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.DRAFT_FOR_USER,
            user: userId
        });
    }
    static stopDraftingForUser(userId) {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.STOP_DRAFT_FOR_USER,
            user: userId
        });
    }
    static updatePendingPickList(pendingPickList) {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.UPDATE_PENDING_PICK_LIST,
            pendingPickList: pendingPickList
        });
    }
    static resetPendingPickList() {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.RESET_PENDING_PICK_LIST
        });
    }
    static savePickList() {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.SAVE_PICK_LIST
        });
    }
    static setPickList(pickList) {
        AppDispatcher_1.default.handleViewAction({
            actionType: DraftConstants_1.default.SET_PICK_LIST,
            pickList: pickList
        });
    }
}
exports.default = DraftActions;
;
