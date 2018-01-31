"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const AppConstants_1 = require("../constants/AppConstants");
const DraftConstants_1 = require("../constants/DraftConstants");
const Store_1 = require("./Store");
const UserStore_1 = require("./UserStore");
const fetch_1 = require("../fetch");
let _picks = [];
let _pickOrder = [];
let _pickForUsers = [];
let _pickList = null;
let _pendingPickList = null;
function resetPickList() {
    _pickList = null;
    _pendingPickList = null;
}
function getCurrentPickNumber() {
    return _picks.length;
}
function getCurrentPick() {
    const pickNumber = getCurrentPickNumber();
    if (pickNumber === _pickOrder.length) {
        return null;
    }
    return {
        user: _pickOrder[pickNumber].user,
        pickNumber: pickNumber
    };
}
function addPick(golfer) {
    const timestamp = new Date();
    const pick = _.extend({}, getCurrentPick(), {
        golfer: golfer,
        timestamp: timestamp,
        clientTimestamp: timestamp
    });
    _picks.push(pick);
    return pick;
}
function filterPicksFromPickLists() {
    if (!_.isArray(_pickList))
        return;
    const pickedGids = _.map(_picks, 'golfer');
    if (_pickList !== _pendingPickList) {
        _pickList = _.difference(_pickList, pickedGids);
        _pendingPickList = _.difference(_pendingPickList, pickedGids);
    }
    else {
        _pickList = _.difference(_pickList, pickedGids);
        _pendingPickList = _pickList;
    }
}
class DraftStoreImpl extends Store_1.default {
    changeEvent() { return 'DraftStore:change'; }
    getCurrentPick() { return getCurrentPick(); }
    getDraftPicks() { return _picks; }
    getPickOrder() { return _pickOrder; }
    getIsMyDraftPick() {
        const currentPick = getCurrentPick();
        const currentUser = UserStore_1.default.getCurrentUser();
        if (!currentPick || !currentUser)
            return false;
        return (currentPick.user === currentUser._id ||
            _.includes(_pickForUsers, currentPick.user));
    }
    getPickingForUsers() { return _pickForUsers; }
    getPickList() { return _pickList; }
    getPendingPickList() { return _pendingPickList; }
}
const DraftStore = new DraftStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case DraftConstants_1.default.DRAFT_PICK:
            const pick = addPick(action.golfer);
            filterPicksFromPickLists();
            // TODO - Move to separate server sync
            fetch_1.postJson('/draft/picks', pick)
                .catch(function () {
                // No real error handling here, just reload the page to make sure we
                // don't get people in a weird state.
                window.location.reload();
            });
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.DRAFT_PICK_HIGHEST_PRI:
            const partialPick = getCurrentPick();
            // TODO - Move to separate server sync
            fetch_1.post('/draft/pickPickListGolfer')
                .catch(function () {
                // No real error handling here, just reload the page to make sure we
                // don't get people in a weird state.
                window.location.reload();
            });
            break;
        case DraftConstants_1.default.DRAFT_UPDATE:
            const draft = action.draft;
            _picks = draft.picks;
            _pickOrder = draft.pickOrder;
            filterPicksFromPickLists();
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.DRAFT_FOR_USER:
            _pickForUsers = _.uniq(_pickForUsers.concat([action.user]));
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.STOP_DRAFT_FOR_USER:
            _pickForUsers = _.without(_pickForUsers, action.user);
            DraftStore.emitChange();
            break;
        case AppConstants_1.default.CURRENT_USER_CHANGE:
            resetPickList();
            DraftStore.emitChange();
            break;
        case AppConstants_1.default.CURRENT_USER_CHANGE_SYNCED:
            const currentUser = UserStore_1.default.getCurrentUser();
            if (currentUser) {
                // TODO - Move to separate server sync
                fetch_1.fetch('/draft/pickList')
                    .then(function (data) {
                    if (data.userId === currentUser._id) {
                        _pickList = data.pickList;
                        _pendingPickList = _pickList;
                        filterPicksFromPickLists();
                        DraftStore.emitChange();
                    }
                });
            }
            break;
        case DraftConstants_1.default.UPDATE_PENDING_PICK_LIST:
            _pendingPickList = action.pendingPickList;
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.RESET_PENDING_PICK_LIST:
            _pendingPickList = _pickList;
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.SAVE_PICK_LIST:
            _pickList = _pendingPickList;
            // TODO - Move to separate server sync
            const data = { pickList: _pickList };
            fetch_1.postJson('/draft/pickList', data)
                .catch(function () {
                window.location.reload();
            });
            DraftStore.emitChange();
            break;
        case DraftConstants_1.default.SET_PICK_LIST:
            _pickList = action.pickList;
            _pendingPickList = _pickList;
            DraftStore.emitChange();
            break;
    }
    return true; // No errors.  Needed by promise in Dispatcher.
});
exports.default = DraftStore;
