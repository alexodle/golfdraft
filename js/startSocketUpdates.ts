import {once} from 'lodash';
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
  io.on('change:draft', ev => {
    const draft = parseDraft(ev.data);
    DraftActions.draftUpdate(draft);
  });
  io.on('change:scores', ev => {
    ScoreActions.scoreUpdate(ev.data);
  });
  io.on('change:chat', ev => {
    ChatActions.newMessage(ev.data);
  });
  io.on('change:appstate', ev => {
    SettingsActions.setAppState(ev.data.appState);
  });
  io.on('change:activeusers', ev => {
    UserActions.setActiveUsers(ev.data.users);
  });

  // ADMIN power
  io.on('action:forcerefresh', ev => {
    window.location.reload();
  });
}

export default once(startSocketUpdates);
