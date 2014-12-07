'use strict';

var server = require('./expressServer');
var io = require('socket.io').listen(server);

module.exports = io;
