'use strict';

var merge = require('react/lib/merge');
var _ = require('underscore');
var $ = require('jquery');

var Store = require('./Store');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var DraftConstants = require('../constants/DraftConstants');

var _picks = [];
var _pickOrder = [];

function getCurrentPick() {
  if (_picks.length === _pickOrder.length) {
    return null;
  }
  return {
    player: _pickOrder[_picks.length],
    pickNumber: _picks.length
  };
}

function addPick(golfer) {
  var pick = merge(getCurrentPick(), {
    golfer: golfer
  });
  _picks.push(pick);
  return pick;
}

var DraftStore = merge(Store.prototype, {

  changeEvent: 'DraftStore:change',

  getCurrentPick: getCurrentPick,

  getPickOrder: function () {
    return _.clone(_pickOrder);
  },

  getDraftPicks: function () {
    return _.clone(_picks);
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

    default:
      return true;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

// HACKHACK
_picks = window.golfDraftSeed.draft.picks;
_pickOrder = window.golfDraftSeed.draft.pickOrder;

module.exports = DraftStore;
