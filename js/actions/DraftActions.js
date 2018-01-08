'use strict';

const _ = require("lodash");
const AppDispatcher = require('../dispatcher/AppDispatcher');
const DraftConstants = require('../constants/DraftConstants');

const DraftActions = {

  makePick: function (golfer) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_PICK,
      golfer: golfer
    });
  },

  makePickListPick: function () {
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

  updatePendingPickList: function (pendingPickList) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.UPDATE_PENDING_PRIORITY,
      pendingPickList: pendingPickList
    });
  },

  resetPendingPickList: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.RESET_PENDING_PRIORITY
    });
  },

  savePickList: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SAVE_PRIORITY
    });
  },

  setPickList: function (pickList) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SET_PRIORITY,
      pickList: pickList
    });
  }

};

module.exports = DraftActions;
