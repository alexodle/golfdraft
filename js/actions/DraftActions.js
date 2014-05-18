'use strict';

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
  }

};

module.exports = DraftActions;
