'use strict';

var $ = require('jquery');
var _ = require('lodash');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');
var DraftConstants = require('../constants/DraftConstants');
var Store = require('./Store');
var UserStore = require('./UserStore');

var _picks = [];
var _pickOrder = [];
var _pickForPlayers = [];
var _priority = null;

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
  var timestamp = new Date();
  var pick =  _.extend({}, getCurrentPick(), {
    golfer: golfer,
    timestamp: timestamp,
    clientTimestamp: timestamp
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

    return (
      currentPick.player === currentUser.player ||
      _.contains(_pickForPlayers, currentPick.player)
    );
  },

  getPickingForPlayers: function () {
    return _pickForPlayers;
  },

  getPriority: function () {
    return _priority;
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
      _pickForPlayers = _.uniq(_pickForPlayers.concat([action.player]));
      DraftStore.emitChange();
      break;

    case DraftConstants.STOP_DRAFT_FOR_PLAYER:
      _pickForPlayers = _.without(_pickForPlayers, action.player);
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      _priority = null;
      DraftStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE_SYNCED:
      var currentUser = UserStore.getCurrentUser();
      if (currentUser !== null) {
        // TODO - Move to separate server sync
        $.get('/draft/priority', pick)
        .done(function (data) {
          if (data.playerId === currentUser.id) {
            _priority = data.priority;
            DraftStore.emitChange();
          }
        });
      }
      break;

    case DraftConstants.UPDATE_PRIORITY:
      var data = { priority: action.priority };
      _priority = action.priority;

      // TODO - Move to separate server sync
      $.post('/draft/priority', data)
      .fail(function () {
        //window.location.reload();
      });

      DraftStore.emitChange();
      break;
  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

module.exports = DraftStore;
