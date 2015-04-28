var _ = require('lodash');
var io = require('./socketIO');
var redis = require('./redis');

var redisClient = redis.client;

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

var UserAccess = {

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
