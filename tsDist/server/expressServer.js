"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressApp_1 = require("./expressApp");
const http = require("http");
exports.default = http.createServer(expressApp_1.default);
