'use strict';

const app = require('./expressApp');
const server = require("http").createServer(app);

module.exports = server;
