var _ = require('lodash');
var ChatActions = require('./actions/ChatActions');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');
var socketio = require('socket.io-client');

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
}

module.exports = _.once(startSocketUpdates);
