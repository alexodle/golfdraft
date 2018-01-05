'use strict';

const server = require('./expressServer');
const io = require('socket.io').listen(server);

io.set('log level', 1);

module.exports = io;
