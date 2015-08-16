'use strict';

var $ = require('jquery');
var _ = require('lodash');
var AppActions = require('./actions/AppActions');
var ChatActions = require('./actions/ChatActions');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');
var SettingsActions = require('./actions/SettingsActions');
var socketio = require('socket.io-client');
var UserActions = require('./actions/UserActions');

var hasConnected = false;

/** Start listening for app-wide socket.io updates
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

  // Force refresh if it's been sufficiently long since our last update
  io.on('connect', function () {
    if (!hasConnected) {
      hasConnected = true;
    } else {

      // TODO - Move to separate server sync
      $.get('/bootstrap')
      .fail(function () {
        // No real error handling here, just reload the page to make sure we
        // don't get people in a weird state.
        window.location.reload();
      })
      .success(function (results) {
        AppActions.setPlayers(results.players);
        AppActions.setGolfers(results.golfers);
        DraftActions.draftUpdate(results.draft);
        ScoreActions.scoreUpdate({
          scores: results.scores,
          lastUpdated: results.tourney.lastUpdated
        });
        SettingsActions.setIsPaused(results.appState.isDraftPaused);
      });
    }
  });
}

module.exports = _.once(startSocketUpdates);
