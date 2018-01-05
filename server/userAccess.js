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

  onUserLogin: function (session) {
    redisClient.hset('users', session.id, session.user.id, onUserChange);
  },

  onUserLogout: function (session) {
    redisClient.hdel('users', session.id, onUserChange);
  }

};

module.exports = UserAccess;
