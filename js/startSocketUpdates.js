var _ = require('lodash');
var ChatActions = require('./actions/ChatActions');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');
var SettingsActions = require('./actions/SettingsActions');
var socketio = require('socket.io-client');

/** Starts listening for app-wide socket.io updates
*/
function startSocketUpdates() {
  var io = socketio.connect();
  io.on('change:draft', function (ev) {
    console.log('hihi.change.draft');
    DraftActions.draftUpdate(ev.data);
  });
  io.on('change:scores', function (ev) {
    console.log('hihi.change.scores');
    ScoreActions.scoreUpdate(ev.data);
  });
  io.on('change:chat', function (ev) {
    console.log('hihi.change.chat');
    ChatActions.newMessage(ev.data);
  });
  io.on('change:ispaused', function (ev) {
    console.log('hihi.change.ispaused');
    SettingsActions.setIsPaused(ev.data.isPaused);
  });
  io.on('action:forcerefresh', function (ev) {
    console.log('hihi.action.forcerefresh');
    window.location.reload();
  });
}

module.exports = _.once(startSocketUpdates);
