import * as $ from 'jquery';
import * as _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import AppConstants from '../constants/AppConstants';
import DraftConstants from '../constants/DraftConstants';
import Store from './Store';
import UserStore from './UserStore';
import {DraftPick, DraftPickOrder} from '../types/Types';

let _picks: DraftPick[] = [];
let _pickOrder: DraftPickOrder[] = [];
let _pickForUsers: string[] = [];

let _pickList: string[] = null;
let _pendingPickList: string[] = null;

function resetPickList() {
  _pickList = null;
  _pendingPickList = null;
}

function getCurrentPickNumber() {
  return _picks.length;
}

function getCurrentPick(): DraftPickOrder {
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
  const pick =  _.extend({}, getCurrentPick(), {
    golfer: golfer,
    timestamp: timestamp,
    clientTimestamp: timestamp
  });
  _picks.push(pick);
  return pick;
}

function filterPicksFromPickLists() {
  if (!_.isArray(_pickList)) return;

  const pickedGids = _.map(_picks, 'golfer');
  if (_pickList !== _pendingPickList) {
    _pickList = _.difference(_pickList, pickedGids);
    _pendingPickList = _.difference(_pendingPickList, pickedGids);
  } else {
    _pickList = _.difference(_pickList, pickedGids);
    _pendingPickList = _pickList;
  }
}

class DraftStoreImpl extends Store {
  changeEvent() { return 'DraftStore:change'; }
  getCurrentPick() { return getCurrentPick(); }
  getDraftPicks() { return _picks }
  getPickOrder() { return _pickOrder }
  getIsMyDraftPick() {
    const currentPick = getCurrentPick();
    const currentUser = UserStore.getCurrentUser();
    if (!currentPick || !currentUser) return false;

    return (
      currentPick.user === currentUser._id ||
      _.includes(_pickForUsers, currentPick.user)
    );
  }
  getPickingForUsers() { return _pickForUsers }
  getPickList() { return _pickList }
  getPendingPickList() { return _pendingPickList }
}
const DraftStore = new DraftStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case DraftConstants.DRAFT_PICK:
      const pick = addPick(action.golfer);
      filterPicksFromPickLists();

      // TODO - Move to separate server sync
      $.post('/draft/picks', pick)
      .fail(function () {
        // No real error handling here, just reload the page to make sure we
        // don't get people in a weird state.
        window.location.reload();
      });

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_PICK_HIGHEST_PRI:
      const partialPick = getCurrentPick();

      // TODO - Move to separate server sync
      $.post('/draft/pickPickListGolfer', {
        fail: () => window.location.reload()
      });
      break;

    case DraftConstants.DRAFT_UPDATE:
      const draft = action.draft;
      _picks = draft.picks;
      _pickOrder = draft.pickOrder;
      filterPicksFromPickLists();

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_FOR_USER:
      _pickForUsers = _.uniq(_pickForUsers.concat([action.user]));
      DraftStore.emitChange();
      break;

    case DraftConstants.STOP_DRAFT_FOR_USER:
      _pickForUsers = _.without(_pickForUsers, action.user);
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      resetPickList();
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE_SYNCED:
      const currentUser = UserStore.getCurrentUser();
      if (currentUser) {
        // TODO - Move to separate server sync
        $.get('/draft/pickList')
        .done(function (data) {
          if (data.userId === currentUser._id) {
            _pickList = data.pickList;
            _pendingPickList = _pickList;
            filterPicksFromPickLists();
            DraftStore.emitChange();
          }
        });
      }
      break;

    case DraftConstants.UPDATE_PENDING_PICK_LIST:
      _pendingPickList = action.pendingPickList;
      DraftStore.emitChange();
      break;

    case DraftConstants.RESET_PENDING_PICK_LIST:
      _pendingPickList = _pickList;
      DraftStore.emitChange();
      break;

    case DraftConstants.SAVE_PICK_LIST:
      _pickList = _pendingPickList;

      // TODO - Move to separate server sync
      const data = { pickList: _pickList };
      $.post('/draft/pickList', data)
        .fail(function () {
          window.location.reload();
        });

      DraftStore.emitChange();
      break;

    case DraftConstants.SET_PICK_LIST:
      _pickList = action.pickList;
      _pendingPickList = _pickList;

      DraftStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

export default DraftStore;
