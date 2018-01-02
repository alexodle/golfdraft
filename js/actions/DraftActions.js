'use strict';

var _ = require("lodash");
var AppDispatcher = require('../dispatcher/AppDispatcher');
var DraftConstants = require('../constants/DraftConstants');

var DraftActions = {

  makePick: function (golfer) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_PICK,
      golfer: golfer
    });
  },

  makeHighestPriorityPick: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_PICK_HIGHEST_PRI
    });
  },

  draftUpdate: function (draft) {
    AppDispatcher.handleServerAction({
      actionType: DraftConstants.DRAFT_UPDATE,
      draft: draft
    });
  },

  draftForPlayer: function (player) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_FOR_PLAYER,
      player: player
    });
  },

  stopDraftingForPlayer: function (player) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.STOP_DRAFT_FOR_PLAYER,
      player: player
    });
  },

  updatePendingPriority: function (pendingPriority) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.UPDATE_PENDING_PRIORITY,
      pendingPriority: pendingPriority
    });
  },

  resetPendingPriority: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.RESET_PENDING_PRIORITY
    });
  },

  savePriority: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SAVE_PRIORITY
    });
  }

};

module.exports = DraftActions;
