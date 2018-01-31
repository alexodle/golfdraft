"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppConstants_1 = require("../constants/AppConstants");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const ChatActions_1 = require("../actions/ChatActions");
const ChatConstants_1 = require("../constants/ChatConstants");
const Store_1 = require("./Store");
const UserStore_1 = require("./UserStore");
const fetch_1 = require("../fetch");
let _messages = null;
class ChatStoreImpl extends Store_1.default {
    changeEvent() { return 'ChatStore:change'; }
    getMessages() { return _messages; }
}
const ChatStore = new ChatStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case AppConstants_1.default.CURRENT_USER_CHANGE_SYNCED:
            const currentUser = UserStore_1.default.getCurrentUser();
            if (currentUser) {
                fetch_1.fetch('/chat/messages')
                    .then(ChatActions_1.default.setMessages);
            }
            break;
        case ChatConstants_1.default.SET_MESSAGES:
            _messages = _.sortBy(action.messages, 'date');
            ChatStore.emitChange();
            break;
        case ChatConstants_1.default.NEW_MESSAGE:
            // If we still haven't received our first message, move on. We'll get
            // this message with our first payload.
            if (_messages) {
                _messages = _messages.concat([action.message]);
                ChatStore.emitChange();
            }
            break;
        case ChatConstants_1.default.CREATE_MESSAGE:
            // TODO - Move to separate server sync
            //
            // TODO - strategy for optimistically updating UI. Suggestion: add a unique
            // GUID from the UI that can be matched upon receipt of the message from
            // socket.io. We can use that to de-dupe.
            //
            // For now, fire and forget. If success, we will update the UI via
            // socket.io update.
            //
            fetch_1.postJson('/chat/messages', { message: action.message });
            break;
    }
    return true;
});
exports.default = ChatStore;
