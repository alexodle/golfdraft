'use strict';

var app = require('./expressApp');
var server = require("http").createServer(app);

module.exports = server;
