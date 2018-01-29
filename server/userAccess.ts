import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';

const redisClient = redis.client;

function onUserChange() {
  redisClient.hvals('users', function (err, replies) {
    if (err) {
      console.error(err);
      return;
    }

    io.sockets.emit('change:activeusers', {
      data: {
        userCounts: _.countBy(replies)
      }
    });
  });
}

export function refresh() {
  redisClient.del('users');
}

export function onUserActivity(sessionId: string, userId: string) {
  console.log("onUserActivity: " + sessionId + ", userId:" + userId);
  redisClient.hset('users', sessionId, userId, onUserChange);
}

export function onUserLogout(sessionId: string) {
  redisClient.hdel('users', sessionId, onUserChange);
}
