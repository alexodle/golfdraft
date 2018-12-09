import {countBy, keys} from 'lodash';
import {getUser} from './access';
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
  
      const counts = countBy(replies);
      resolve(counts);
    });
  });
}

async function onUserChange() {
  const userCounts = await getUserCounts();
  const data = { data: { users: keys(userCounts) } };
  io.sockets.emit('change:activeusers', data);
}

export function refresh() {
  redisClient.del('users');
}

export async function onUserActivity(sessionId: string, userId: string, activity: string) {
  redisClient.hset('users', sessionId, userId, onUserChange);
  const user = await getUser(userId);
  console.log(`onUserActivity: ${sessionId}, user: ${user.username}, activity: ${activity}`);
}

export function onUserLogout(sessionId: string) {
  redisClient.hdel('users', sessionId, onUserChange);
}
