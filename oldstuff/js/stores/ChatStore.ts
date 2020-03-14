import {sortBy} from 'lodash';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ChatActions from '../actions/ChatActions';
import ChatConstants from '../constants/ChatConstants';
import Store from './Store';
import UserStore from './UserStore';
import {ChatMessage} from '../types/ClientTypes';
import {postJson, fetch} from '../fetch';

let _messages: ChatMessage[] = null;

class ChatStoreImpl extends Store {
  changeEvent() { return 'ChatStore:change'; }
  getMessages() { return _messages; }
}
const ChatStore = new ChatStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.CURRENT_USER_CHANGE_SYNCED:
      const currentUser = UserStore.getCurrentUser();
      if (currentUser) {
        fetch('chat/messages')
          .then(ChatActions.setMessages);
      }
      break;

    case ChatConstants.SET_MESSAGES:
      _messages = sortBy(action.messages, 'date');
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
      postJson('chat/messages', { message: action.message });
      break;
  }

  return true;
});

export default ChatStore;
