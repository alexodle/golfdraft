const _ = require('lodash');
const io = require('./socketIO');
const redis = require('./redis');

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

const UserAccess = {

  refresh: function () {
    redisClient.del('users');
  },

  onUserActivity: function (sessionId, userId) {
    redisClient.hset('users', sessionId, userId, onUserChange);
  },

  onUserLogout: function (sessionId) {
    redisClient.hdel('users', sessionId, onUserChange);
  }

};

module.exports = UserAccess;
