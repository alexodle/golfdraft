const _ = require('lodash');
const io = require('./socketIO');
const redis = require('./redis');
const UserAccess = require('./userAccess');

const redisClient = redis.client;

io.on('connection', function (socket) {
  const session = socket.request.session;

  if (session.user) {
    UserAccess.onUserActivity(session);
  }

  socket.on('disconnect', function() {
    UserAccess.onUserLogout(session);
  });
});
