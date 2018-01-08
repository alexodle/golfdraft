'use strict';

const $ = require('jquery');
const _ = require('lodash');
const AppDispatcher = require('../dispatcher/AppDispatcher');
const AppConstants = require('../constants/AppConstants');
const DraftConstants = require('../constants/DraftConstants');
const Store = require('./Store');
const UserStore = require('./UserStore');

let _picks = [];
let _pickOrder = [];
let _pickForPlayers = [];

let _pickList = null;
let _pendingPickList = null;
resetPickList();

function resetPickList() {
  _pickList = AppConstants.PROPERTY_LOADING;
  _pendingPickList = _pickList;
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
    player: _pickOrder[pickNumber].player,
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

function filterPicksFromPriorities() {
  const pickedGids = _.pluck(_picks, 'golfer');
  if (_pickList !== _pendingPickList) {
    _pickList = _.difference(_pickList, pickedGids);
    _pendingPickList = _.difference(_pendingPickList, pickedGids);
  } else {
    _pickList = _.difference(_pickList, pickedGids);
    _pendingPickList = _pickList;
  }
}

const DraftStore =  _.extend({}, Store.prototype, {

  changeEvent: 'DraftStore:change',

  getCurrentPick: getCurrentPick,

  getPickOrder: function () {
    return _pickOrder;
  },

  getDraftPicks: function () {
    return _picks;
  },

  getIsMyDraftPick: function () {
    const currentPick = getCurrentPick();
    const currentUser = UserStore.getCurrentUser();
    if (!currentPick || !currentUser) return false;

    return (
      currentPick.player === currentUser.player ||
      _.contains(_pickForPlayers, currentPick.player)
    );
  },

  getPickingForPlayers: function () {
    return _pickForPlayers;
  },

  getPickList: function () {
    return _pickList;
  },

  getPendingPickList: function () {
    return _pendingPickList;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case DraftConstants.DRAFT_PICK:
      const pick = addPick(action.golfer);
      filterPicksFromPriorities();

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
      $.post('/draft/pickPickListGolfer', partialPick)
      .fail(function () {
        // No real error handling here, just reload the page to make sure we
        // don't get people in a weird state.
        window.location.reload();
      });
      break;

    case DraftConstants.DRAFT_UPDATE:
      const draft = action.draft;
      _picks = draft.picks;
      _pickOrder = draft.pickOrder;
      filterPicksFromPriorities();

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_FOR_PLAYER:
      _pickForPlayers = _.uniq(_pickForPlayers.concat([action.player]));
      DraftStore.emitChange();
      break;

    case DraftConstants.STOP_DRAFT_FOR_PLAYER:
      _pickForPlayers = _.without(_pickForPlayers, action.player);
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      resetPickList();
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE_SYNCED:
      const currentUser = UserStore.getCurrentUser();
      if (!!currentUser) {
        // TODO - Move to separate server sync
        $.get('/draft/pickList')
        .done(function (data) {
          if (data.playerId === currentUser.id) {
            _pickList = data.pickList;
            _pendingPickList = _pickList;
            filterPicksFromPriorities();
            DraftStore.emitChange();
          }
        });
      }
      break;

    case DraftConstants.UPDATE_PENDING_PRIORITY:
      _pendingPickList = action.pendingPickList;
      DraftStore.emitChange();
      break;

    case DraftConstants.RESET_PENDING_PRIORITY:
      _pendingPickList = _pickList;
      DraftStore.emitChange();
      break;

    case DraftConstants.SAVE_PRIORITY:
      _pickList = _pendingPickList;

      // TODO - Move to separate server sync
      const data = { pickList: _pickList };
      $.put('/draft/pickList', data)
      .fail(function () {
        window.location.reload();
      });

      DraftStore.emitChange();
      break;

    case DraftConstants.SET_PRIORITY:
      _pickList = action.pickList;
      _pendingPickList = _pickList;
      
      DraftStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = DraftStore;
