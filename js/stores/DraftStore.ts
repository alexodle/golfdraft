import { difference, includes, uniq, without } from 'lodash';
import AppConstants from '../constants/AppConstants';
import DraftConstants from '../constants/DraftConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import { fetch, postJson } from '../fetch';
import { DraftPick, DraftPickOrder } from '../types/ClientTypes';
import Store from './Store';
import UserStore from './UserStore';

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
  const pick = {
    ...getCurrentPick(),
    golfer: golfer,
    timestamp: timestamp,
    clientTimestamp: timestamp
  };
  _picks.push(pick);
  return pick;
}

function filterPicksFromPickLists() {
  const pickedGids = _picks.map(p => p.golfer);
  if (_pickList !== _pendingPickList) {
    _pickList = difference(_pickList, pickedGids);
    _pendingPickList = difference(_pendingPickList, pickedGids);
  } else {
    _pickList = difference(_pickList, pickedGids);
    _pendingPickList = _pickList;
  }
}

function setPickList(pickList: string[]) {
  _pickList = pickList;
  _pendingPickList = _pickList;
  filterPicksFromPickLists();
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
      includes(_pickForUsers, currentPick.user)
    );
  }
  getPickingForUsers() { return _pickForUsers }
  getPickList() { return _pickList }
  getPendingPickList() { return _pendingPickList }
}
const DraftStore = new DraftStoreImpl();

// Register to handle all updates
AppDispatcher.register(async payload => {
  const action = payload.action;

  switch (action.actionType) {

    case DraftConstants.DRAFT_PICK:
      const pick = addPick(action.golfer);
      filterPicksFromPickLists();

      // TODO - Move to separate server sync
      try {
        await postJson('/draft/picks', pick)
      } catch {
        window.location.reload();
      }

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_PICK_HIGHEST_PRI:
      const partialPick = getCurrentPick();

      // TODO - Move to separate server sync
      try {
        await postJson('/draft/pickPickListGolfer', partialPick);
      } catch  {
        window.location.reload();
      }
      break;

    case DraftConstants.DRAFT_UPDATE:
      const draft = action.draft;
      _picks = draft.picks;
      _pickOrder = draft.pickOrder;
      filterPicksFromPickLists();

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_FOR_USER:
      _pickForUsers = uniq(_pickForUsers.concat([action.user]));
      DraftStore.emitChange();
      break;

    case DraftConstants.STOP_DRAFT_FOR_USER:
      _pickForUsers = without(_pickForUsers, action.user);
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      resetPickList();
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE_SYNCED:
      const currentUser = UserStore.getCurrentUser();
      if (currentUser && !action.isHydration) {
        // TODO - Move to separate server sync
        const data = await fetch('/draft/pickList');
        if (data.userId === currentUser._id) {
          setPickList(data.pickList);
          DraftStore.emitChange();
        }
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
      try {
        await postJson('/draft/pickList', data);
      } catch {
        window.location.reload();
      }

      DraftStore.emitChange();
      break;

    case DraftConstants.SET_PICK_LIST:
      setPickList(action.pickList);
      DraftStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

export default DraftStore;
