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

let _hasConnected = false;

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
  io.on('change:ispaused', function (ev) {
    SettingsActions.setIsPaused(ev.data.isPaused);
  });
  io.on('change:allowclock', function (ev) {
    SettingsActions.setAllowClock(ev.data.allowClock);
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
    if (!_hasConnected) {
      _hasConnected = true;
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
