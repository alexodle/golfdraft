"use strict";
// Refreshes users, pick order, draft picks, and chat
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const access = require("./access");
const mongooseUtil = require("./mongooseUtil");
const tourneyConfigReader_1 = require("./tourneyConfigReader");
const tourneyUtils_1 = require("./tourneyUtils");
function refreshUserState(pickOrderNames) {
    return Promise.all([
        access.clearPickOrder(),
        access.clearDraftPicks(),
        access.clearChatMessages(),
        access.clearPickLists()
    ])
        .then(() => {
        const users = _.map(pickOrderNames, (name) => {
            return { name: name };
        });
        return access.ensureUsers(users);
    })
        .then(() => {
        return access.getUsers().then((users) => {
            return _.sortBy(users, (u) => {
                return _.indexOf(pickOrderNames, u.name);
            });
        });
    })
        .then((sortedUsers) => {
        const pickOrder = tourneyUtils_1.snakeDraftOrder(sortedUsers);
        return access.setPickOrder(pickOrder);
    });
}
exports.default = refreshUserState;
if (require.main === module) {
    mongooseUtil.connect()
        .then(() => {
        const tourneyCfg = tourneyConfigReader_1.loadConfig();
        return refreshUserState(tourneyCfg.draftOrder);
    })
        .then(() => {
        mongooseUtil.close();
    })
        .catch((err) => {
        console.log(err);
    });
}
