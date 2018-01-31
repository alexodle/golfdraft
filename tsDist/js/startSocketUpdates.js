"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const ChatActions_1 = require("./actions/ChatActions");
const DraftActions_1 = require("./actions/DraftActions");
const DraftParser_1 = require("./logic/DraftParser");
const ScoreActions_1 = require("./actions/ScoreActions");
const SettingsActions_1 = require("./actions/SettingsActions");
const socketio = require("socket.io-client");
const UserActions_1 = require("./actions/UserActions");
/** Start listening for app-wide socket.io updates
*/
function startSocketUpdates() {
    const io = socketio.connect();
    io.on('change:draft', function (ev) {
        const draft = DraftParser_1.default(ev.data);
        DraftActions_1.default.draftUpdate(draft);
    });
    io.on('change:scores', function (ev) {
        ScoreActions_1.default.scoreUpdate(ev.data);
    });
    io.on('change:chat', function (ev) {
        ChatActions_1.default.newMessage(ev.data);
    });
    io.on('change:appstate', function (ev) {
        SettingsActions_1.default.setAppState(ev.data.appState);
    });
    io.on('change:activeusers', function (ev) {
        UserActions_1.default.setActiveUsers(ev.data.userCounts);
    });
    // ADMIN power
    io.on('action:forcerefresh', function (ev) {
        window.location.reload();
    });
}
exports.default = _.once(startSocketUpdates);
