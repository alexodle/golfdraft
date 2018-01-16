// @flow
'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const ChatConstants = require('../constants/ChatConstants');

const ChatActions = {

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
