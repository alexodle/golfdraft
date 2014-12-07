'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var ChatConstants = require('../constants/ChatConstants');

var ChatActions = {

  setMessages: function (messages) {
    AppDispatcher.handleServerAction({
      actionType: ChatConstants.SET_MESSAGES,
      messages: messages
    });
  },

  newMessage: function (message) {
    AppDispatcher.handleServerAction({
      actionType: ChatConstants.NEW_MESSAGE,
      message: message
    });
  },

  createMessage: function (message) {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.CREATE_MESSAGE,
      message: message
    });
  }

};

module.exports = ChatActions;
