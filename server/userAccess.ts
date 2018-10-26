import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';

const redisClient = redis.client;

function getUserCounts(): Promise<{ [userId: string]: number }> {
  return new Promise((resolve, reject) => {
    redisClient.hvals('users', (err, replies) => {
      if (err) {
        console.error(err);
        reject(err);
      }
  
      const counts = _.countBy(replies);
      resolve(counts);
    });
  });
}

async function onUserChange() {
  const userCounts = await getUserCounts();
  const data = { data: { users: _.keys(userCounts) } };
  io.sockets.emit('change:activeusers', data);
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
