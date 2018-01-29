import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';
import * as userAccess from './userAccess';

const redisClient = redis.client;

io.on('connection', function (socket) {
  const session = socket.request.session;

  if (session.user) {
    userAccess.onUserActivity(session.id, session.user._id.toString());
  }

  socket.on('disconnect', function() {
    userAccess.onUserLogout(session.id);
  });
});
