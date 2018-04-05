import * as _ from 'lodash';
import io from './socketIO';
import redis from './redis';

const redisClient = redis.client;

const EXPIRY_MILLIS = 30 * 60 * 1000;
const CLEAN_INTERVAL = EXPIRY_MILLIS / 2;

export function getActiveUsers(): Promise<string[]> {
  const currTime = (new Date()).getTime();

  return new Promise((fulfill, reject) => {
    redisClient.hgetall('users', (err, replies) => {
      if (err) {
        console.log('Error: ' + err);
        reject(err);
        return;
      }

      const activeUsers = _.chain(replies)
        .pickBy(timeStr => currTime - _.parseInt(timeStr) <= EXPIRY_MILLIS)
        .keys()
        .value();

      console.log(`hihi.activeUsers: ${activeUsers}`);
      console.log(`hihi.knownUsers: ${_.keys(replies)}`);
      fulfill(activeUsers);
    });
  });
}

export function onUserChange() {
  return getActiveUsers().then(activeUsers => {
    io.sockets.emit('change:activeusers', { data: { activeUsers } });
  });
}

export function onUserActivity(userId: string) {
  console.log(`onUserActivity: ${userId}`);
  redisClient.hset('users', userId, (new Date()).getTime().toString(), onUserChange);
}

export function onUserLogout(userId: string) {
  console.log(`onUserLogout: ${userId}`);
  redisClient.hdel('users', userId, onUserChange);
}

function clean() {
  const currTime = (new Date()).getTime();

  redisClient.hgetall('users', (err, replies) => {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    let changed = false;
    _.each(replies, (timeStr, userId) => {
      console.log(`hihi.clean: currTime:${currTime}, userActivityTime:${_.parseInt(timeStr)}`);
      if (currTime - _.parseInt(timeStr) > EXPIRY_MILLIS) {
        console.log(`hihi.clean.DELETE: ${userId}`);
        redisClient.hdel('users', userId);
        changed = true;
      } else {
        console.log(`hihi.clean.NOT_DELETE: ${userId}`);
      }
    });

    if (changed) {
      console.log(`hihi.clean.USER_CHANGE!`);
      onUserChange();
    }
  });
}

export function startPeriodicClean() {
  clean();
  setInterval(clean, CLEAN_INTERVAL);
}