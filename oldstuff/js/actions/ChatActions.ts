import AppDispatcher from '../dispatcher/AppDispatcher';
import ChatConstants from '../constants/ChatConstants';

export default class ChatActions {

  static setMessages(messages) {
    AppDispatcher.handleServerAction({
      actionType: ChatConstants.SET_MESSAGES,
      messages: messages
    });
  }

  static newMessage(message) {
    AppDispatcher.handleServerAction({
      actionType: ChatConstants.NEW_MESSAGE,
      message: message
    });
  }

  static createMessage(message: string) {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.CREATE_MESSAGE,
      message: message
    });
  }

};
