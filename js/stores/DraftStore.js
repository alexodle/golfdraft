'use strict';

var $ = require('jquery');
var _ = require('lodash');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var DraftConstants = require('../constants/DraftConstants');
var Store = require('./Store');
var UserStore = require('./UserStore');

var _picks = [];
var _pickOrder = [];
var _pickForPlayer = null; // { player: <player_id>, pickNumber: <n> }

function getCurrentPickNumber() {
  return _picks.length;
}

function getCurrentPick() {
  var pickNumber = getCurrentPickNumber();
  if (pickNumber === _pickOrder.length) {
    return null;
  }
  return {
    player: _pickOrder[pickNumber].player,
    pickNumber: pickNumber
  };
}

function addPick(golfer) {
  var pick =  _.extend({}, getCurrentPick(), {
    golfer: golfer
  });
  _picks.push(pick);
  return pick;
}

var DraftStore =  _.extend({}, Store.prototype, {

  changeEvent: 'DraftStore:change',

  getCurrentPick: getCurrentPick,

  getPickOrder: function () {
    return _pickOrder;
  },

  getDraftPicks: function () {
    return _picks;
  },

  getIsMyDraftPick: function () {
    var currentPick = getCurrentPick();
    var currentUser = UserStore.getCurrentUser();
    if (!currentPick || !currentUser) return false;

    return currentPick.player === currentUser.player || (
      _pickForPlayer &&
        _pickForPlayer.player === currentPick.player &&
        _pickForPlayer.pickNumber - currentPick.pickNumber <= 1
    );
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {
    case DraftConstants.DRAFT_PICK:
      var pick = addPick(action.golfer);

      // TODO - Move to separate server sync
      $.post('/draft/picks', pick)
      .fail(function () {
        // No real error handling here, just reload the page to make sure we
        // don't get people in a weird state.
        window.location.reload();
      });

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_UPDATE:
      var draft = action.draft;
      _picks = draft.picks;
      _pickOrder = draft.pickOrder;

      DraftStore.emitChange();
      break;

    case DraftConstants.DRAFT_FOR_PLAYER:
      _pickForPlayer = {
        player: action.player,
        pickNumber: getCurrentPickNumber()
      };
      DraftStore.emitChange();
      break;

    default:
      return true;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = DraftStore;
