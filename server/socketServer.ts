import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';
import * as userAccess from './userAccess';
import config from '../server/config';
import {getAccess} from '../server/access';

const redisClient = redis.client;
const access = getAccess(config.current_tourney_id);

io.on('connection', socket => {
  const session = socket.request.session;

  if (session.passport && session.passport.user) {
    access.getUserByUsername(session.passport.user).then(user => {
      userAccess.onUserActivity(session.id, user._id.toString());
    });
  }

  socket.on('disconnect', () => userAccess.onUserLogout(session.id));
});
