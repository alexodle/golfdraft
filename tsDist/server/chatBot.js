"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const access = require("./access");
const utils = require("../common/utils");
function loadPick(draft, draftPick) {
    const nextPick = draft.pickOrder[draft.picks.length];
    return Promise.all([
        access.getUser(draftPick.user.toString()),
        access.getGolfer(draftPick.golfer.toString()),
        nextPick ? access.getUser(nextPick.user.toString()) : null,
    ])
        .then(function (results) {
        const [pickUser, pickGolfer, nextUser] = results;
        return { pickUser, pickGolfer, nextUser };
    });
}
function sendMessage(message, pickInfo) {
    return access.createChatBotMessage({ message })
        .then(() => {
        if (pickInfo.nextUser) {
            return access.createChatBotMessage({
                message: pickInfo.nextUser.name + ', you\'re up!'
            });
        }
        else {
            return access.createChatBotMessage({
                message: 'Draft is complete!'
            });
        }
    });
}
function broadcastUndoPickMessage(draftPick, draft) {
    return loadPick(draft, draftPick)
        .then((pickInfo) => {
        const { pickUser, pickGolfer } = pickInfo;
        const message = 'PICK REVERTED: ' + pickUser.name + ' picks ' + pickGolfer.name;
        return sendMessage(message, pickInfo);
    });
}
exports.broadcastUndoPickMessage = broadcastUndoPickMessage;
function broadcastAutoPickMessage(draftPick, draft, isPickListPick) {
    return loadPick(draft, draftPick)
        .then(function (pickInfo) {
        const { pickUser, pickGolfer } = pickInfo;
        const message = pickUser.name + ' picks ' + pickGolfer.name + (isPickListPick ?
            ' (auto-draft from pick list)' :
            ' (auto-draft wgr)');
        return sendMessage(message, pickInfo);
    });
}
exports.broadcastAutoPickMessage = broadcastAutoPickMessage;
function broadcastProxyPickListPickMessage(currentUser, draftPick, draft) {
    return loadPick(draft, draftPick)
        .then(function (pickInfo) {
        const { pickUser, pickGolfer } = pickInfo;
        const message = pickUser.name + ' picks ' + pickGolfer.name + ' (pick list proxy from ' + currentUser.name + ')';
        return sendMessage(message, pickInfo);
    });
}
exports.broadcastProxyPickListPickMessage = broadcastProxyPickListPickMessage;
function broadcastPickMessage(currentUser, draftPick, draft) {
    return loadPick(draft, draftPick)
        .then(function (pickInfo) {
        const { pickUser, pickGolfer } = pickInfo;
        const isProxyPick = utils.oidsAreEqual(pickUser._id, currentUser._id);
        let message = pickUser.name + ' picks ' + pickGolfer.name;
        if (isProxyPick) {
            message += ' (proxy from ' + currentUser.name + ')';
        }
        return sendMessage(message, pickInfo);
    });
}
exports.broadcastPickMessage = broadcastPickMessage;
