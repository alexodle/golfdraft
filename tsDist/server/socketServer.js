"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socketIO_1 = require("./socketIO");
const redis_1 = require("./redis");
const userAccess = require("./userAccess");
const redisClient = redis_1.default.client;
socketIO_1.default.on('connection', function (socket) {
    const session = socket.request.session;
    if (session.user) {
        userAccess.onUserActivity(session.id, session.user._id.toString());
    }
    socket.on('disconnect', function () {
        userAccess.onUserLogout(session.id);
    });
});
