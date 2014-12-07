'use strict';

var $ = require('jquery');
var _ = require('lodash');
var ChatConstants = require('../constants/ChatConstants');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var Store = require('./Store');

var _messages = null;

var ChatStore =  _.extend({}, Store.prototype, {

  changeEvent: 'ChatStore:change',

  getMessages: function (id) {
    return _messages;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.actionType) {

    case ChatConstants.SET_MESSAGES:
      _messages = action.messages;
      ChatStore.emitChange();
      break;

    case ChatConstants.ON_NEW_MESSAGE:
      _messages = _messages.concat([action.message]);
      ChatStore.emitChange();
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
      $.post('/chat/messages', action.message);
      break;
  }
});

module.exports = ChatStore;
