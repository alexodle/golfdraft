'use strict';

import _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import DraftConstants from '../constants/DraftConstants';

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

  draftForUser: function (user) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_FOR_USER,
      user: user
    });
  },

  stopDraftingForUser: function (user) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.STOP_DRAFT_FOR_USER,
      user: user
    });
  },

  updatePendingPickList: function (pendingPickList) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.UPDATE_PENDING_PICK_LIST,
      pendingPickList: pendingPickList
    });
  },

  resetPendingPickList: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.RESET_PENDING_PICK_LIST
    });
  },

  savePickList: function () {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SAVE_PICK_LIST
    });
  },

  setPickList: function (pickList) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SET_PICK_LIST,
      pickList: pickList
    });
  }

};

export default DraftActions;
