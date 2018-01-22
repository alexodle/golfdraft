import * as $ from 'jquery';
import * as _ from 'lodash';
import AppActions from './actions/AppActions';
import ChatActions from './actions/ChatActions';
import DraftActions from './actions/DraftActions';
import parseDraft from './logic/DraftParser';
import ScoreActions from './actions/ScoreActions';
import SettingsActions from './actions/SettingsActions';
import * as socketio from 'socket.io-client';
import UserActions from './actions/UserActions';

/** Start listening for app-wide socket.io updates
*/
function startSocketUpdates() {
  const io = socketio.connect();
  io.on('change:draft', function (ev) {
    const draft = parseDraft(ev.data);
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
