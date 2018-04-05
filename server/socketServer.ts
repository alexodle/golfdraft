import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';
import * as userAccess from './userAccess';

const redisClient = redis.client;

io.on('connection', socket => {
  console.log(`hihi.connection`);
  const session = socket.request.session;

  console.dir(session);
  if (session.passport) {
    console.log(`hihi.session.connection: ${session.passport.user}`);
    userAccess.onUserActivity(session.passport.user);
  }

  socket.on('disconnect', () => {
    console.log(`hihi.session.disconnect`);
    if (session.passport) {
      console.log(`hihi.session.disconnect: ${session.passport.user}`);
      userAccess.onUserLogout(session.passport.user);
    }
  });
});
