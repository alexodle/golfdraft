"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
function ensureUser(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.sendStatus(401);
    }
}
function requireSession() {
    return [passport.authenticate('session'), ensureUser];
}
exports.requireSession = requireSession;
