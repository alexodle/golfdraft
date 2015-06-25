'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');

var AutoPickActions = {

  setAutoPickOrder: function (autoPickOrder) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_AUTO_PICK_ORDER,
      autoPickOrder: autoPickOrder
    });
  },

  setIsAutoPick: function (isAutoPick) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.SET_IS_AUTO_PICK,
      isAutoPick: isAutoPick
    });
  }

};

module.exports = AutoPickActions;
