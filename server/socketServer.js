var _ = require('lodash');
var io = require('./socketIO');
var redis = require('./redis');
var UserAccess = require('./userAccess');

var redisClient = redis.client;

io.on('connection', function (socket) {
  var session = socket.request.session;

  if (session.user) {
    UserAccess.onUserLogin(session);
  }

  socket.on('disconnect', function() {
    UserAccess.onUserLogout(session);
  });
});
