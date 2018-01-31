"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressServer_1 = require("./expressServer");
const socketIO = require("socket.io");
const io = socketIO.listen(expressServer_1.default);
exports.default = io;
