"use strict";
// Refreshes users, pick order, draft picks, and chat
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const config_1 = require("./config");
const fs = require("fs");
function _loadConfig() {
    const cfg = JSON.parse(fs.readFileSync(config_1.default.tourney_cfg, 'utf8'));
    return cfg;
}
exports.loadConfig = _.once(_loadConfig);
