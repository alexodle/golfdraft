import io from './socketIO';
import * as userAccess from './userAccess';
import {getUserByUsername} from '../server/access';

io.on('connection', async socket => {
  const session = socket.request.session;

  if (session.passport && session.passport.user) {
    const user = await getUserByUsername(session.passport.user);
    userAccess.onUserActivity(session.id, user._id.toString(), 'socket/login');
  }

  socket.on('disconnect', () => userAccess.onUserLogout(session.id));
});
