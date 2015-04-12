'use strict';

var server = require('./expressServer');
var io = require('socket.io').listen(server);

io.set('log level', 1);

module.exports = io;
