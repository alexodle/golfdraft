import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';
import * as userAccess from './userAccess';
import * as access from './access';

const redisClient = redis.client;

io.on('connection', socket => {
  const session = socket.request.session;

  if (session.passport && session.passport.user) {
    access.getUserByUsername(session.passport.user).then(user => {
      userAccess.onUserActivity(session.id, user._id.toString());
    });
  }

  socket.on('disconnect', () => {
    userAccess.onUserLogout(session.id);
  });
});
