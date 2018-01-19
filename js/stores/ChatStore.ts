import * as $ from 'jquery';
import * as _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ChatConstants from '../constants/ChatConstants';
import Store from './Store';
import {ChatMessage} from '../types/Types';

let _messages: ChatMessage[] = null;

const ChatStore =  _.extend({}, Store.prototype, {

  changeEvent: 'ChatStore:change',

  getMessages: function (id) {
    return _messages;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case ChatConstants.SET_MESSAGES:
      _messages = _.sortBy(action.messages, 'date');
      ChatStore.emitChange();
      break;

    case ChatConstants.NEW_MESSAGE:
      // If we still haven't received our first message, move on. We'll get
      // this message with our first payload.
      if (_messages) {
        _messages = _messages.concat([action.message]);
        ChatStore.emitChange();
      }
      break;

    case ChatConstants.CREATE_MESSAGE:
      // TODO - Move to separate server sync
      //
      // TODO - strategy for optimistically updating UI. Suggestion: add a unique
      // GUID from the UI that can be matched upon receipt of the message from
      // socket.io. We can use that to de-dupe.
      //
      // For now, fire and forget. If success, we will update the UI via
      // socket.io update.
      //
      $.post('/chat/messages', { message: action.message });
      break;
  }
});

export default ChatStore;
