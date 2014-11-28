'use strict';

var $ = require('jquery');
var _ = require('lodash');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var DraftConstants = require('../constants/DraftConstants');
var Store = require('./Store');

var _picks = [];
var _pickOrder = [];

function getCurrentPick() {
  if (_picks.length === _pickOrder.length) {
    return null;
  }
  return {
    player: _pickOrder[_picks.length].player,
    pickNumber: _picks.length
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

    default:
      return true;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = DraftStore;
