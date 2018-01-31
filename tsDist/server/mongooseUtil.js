"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const mongoose = require("mongoose");
exports.mongoose = mongoose;
mongoose.Promise = Promise;
if (!config_1.default.prod) {
    mongoose.set('debug', true);
}
function connect() {
    mongoose.connect(config_1.default.mongo_url);
    return new Promise(function (fulfill, reject) {
        mongoose.connection.once('open', function () {
            fulfill();
        });
        mongoose.connection.once('error', function (err) {
            reject(err);
        });
    });
}
exports.connect = connect;
function close() {
    mongoose.connection.close();
}
exports.close = close;
exports.connection = mongoose.connection;
