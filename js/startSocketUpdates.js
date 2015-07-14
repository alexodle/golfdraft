'use strict';

var _ = require('lodash');
var ChatActions = require('./actions/ChatActions');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');
var SettingsActions = require('./actions/SettingsActions');
var socketio = require('socket.io-client');
var UserActions = require('./actions/UserActions');

/** Starts listening for app-wide socket.io updates
*/
function startSocketUpdates() {
  var io = socketio.connect();
  io.on('change:draft', function (ev) {
    DraftActions.draftUpdate(ev.data);
  });
  io.on('change:scores', function (ev) {
    ScoreActions.scoreUpdate(ev.data);
  });
  io.on('change:chat', function (ev) {
    ChatActions.newMessage(ev.data);
  });
  io.on('change:ispaused', function (ev) {
    SettingsActions.setIsPaused(ev.data.isPaused);
  });
  io.on('change:activeusers', function (ev) {
    UserActions.setActiveUsers(ev.data.userCounts);
  });

  // ADMIN power
  io.on('action:forcerefresh', function (ev) {
    window.location.reload();
  });
}

module.exports = _.once(startSocketUpdates);
