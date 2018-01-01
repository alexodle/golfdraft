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

  updatePriority: function (priority) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.UPDATE_PRIORITY,
      priority: priority
    });
  }

};

module.exports = DraftActions;
