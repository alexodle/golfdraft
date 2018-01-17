'use strict';

const $ = require('jquery');
const _ = require('lodash');
const AppActions = require('./actions/AppActions');
const ChatActions = require('./actions/ChatActions');
const DraftActions = require('./actions/DraftActions');
const DraftParser = require('./logic/DraftParser');
const ScoreActions = require('./actions/ScoreActions');
const SettingsActions = require('./actions/SettingsActions');
const socketio = require('socket.io-client');
const UserActions = require('./actions/UserActions');

/** Start listening for app-wide socket.io updates
*/
function startSocketUpdates() {
  const io = socketio.connect();
  io.on('change:draft', function (ev) {
    const draft = DraftParser.parseDraft(ev.data);
    DraftActions.draftUpdate(draft);
  });
  io.on('change:scores', function (ev) {
    ScoreActions.scoreUpdate(ev.data);
  });
  io.on('change:chat', function (ev) {
    ChatActions.newMessage(ev.data);
  });
  io.on('change:appstate', function (ev) {
    SettingsActions.setAppState(ev.data.appState);
  });
  io.on('change:activeusers', function (ev) {
    UserActions.setActiveUsers(ev.data.userCounts);
  });

  // ADMIN power
  io.on('action:forcerefresh', function (ev) {
    window.location.reload();
  });
}

export default _.once(startSocketUpdates);
