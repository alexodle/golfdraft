"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app = express();
app.set('trust proxy', 1); // trust first proxy
exports.default = app;
