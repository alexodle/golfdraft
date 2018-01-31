"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const socketIO_1 = require("./socketIO");
const redis_1 = require("./redis");
const redisClient = redis_1.default.client;
function onUserChange() {
    redisClient.hvals('users', function (err, replies) {
        if (err) {
            console.error(err);
            return;
        }
        socketIO_1.default.sockets.emit('change:activeusers', {
            data: {
                userCounts: _.countBy(replies)
            }
        });
    });
}
function refresh() {
    redisClient.del('users');
}
exports.refresh = refresh;
function onUserActivity(sessionId, userId) {
    console.log("onUserActivity: " + sessionId + ", userId:" + userId);
    redisClient.hset('users', sessionId, userId, onUserChange);
}
exports.onUserActivity = onUserActivity;
function onUserLogout(sessionId) {
    redisClient.hdel('users', sessionId, onUserChange);
}
exports.onUserLogout = onUserLogout;
