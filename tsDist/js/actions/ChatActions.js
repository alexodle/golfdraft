"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const ChatConstants_1 = require("../constants/ChatConstants");
class ChatActions {
    static setMessages(messages) {
        AppDispatcher_1.default.handleServerAction({
            actionType: ChatConstants_1.default.SET_MESSAGES,
            messages: messages
        });
    }
    static newMessage(message) {
        AppDispatcher_1.default.handleServerAction({
            actionType: ChatConstants_1.default.NEW_MESSAGE,
            message: message
        });
    }
    static createMessage(message) {
        AppDispatcher_1.default.handleViewAction({
            actionType: ChatConstants_1.default.CREATE_MESSAGE,
            message: message
        });
    }
}
exports.default = ChatActions;
;
