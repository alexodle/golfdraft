import io from './socketIO';
import redis from './redis';
import * as userAccess from './userAccess';
import {getActiveTourneyAccess} from '../server/access';

io.on('connection', async socket => {
  const session = socket.request.session;

  if (session.passport && session.passport.user) {
    const access = await getActiveTourneyAccess();
    const user = await access.getUserByUsername(session.passport.user);
    userAccess.onUserActivity(session.id, user._id.toString());
  }

  socket.on('disconnect', () => userAccess.onUserLogout(session.id));
});
