// @flow
'use strict';

const _ = require('lodash');
const access = require('./access');
const Promise = require('promise');
const utils = require('../common/utils');

function loadPick(draft, draftPick) {
  const nextPick = draft.pickOrder[draft.picks.length];
  return Promise.all(_.compact([
      access.getUser(draftPick.user),
      access.getGolfer(draftPick.golfer),
      nextPick ? access.getUser(nextPick.user) : null,
    ]))
    .then(function (results){
      const [pickUser, pickGolfer, nextUser] = results;
      return { pickUser, pickGolfer, nextUser };
    });
}

function sendMessage(message, pickInfo) {
  return access.createChatBotMessage({ message: message})
    .then(function () {
      if (pickInfo.nextUser) {
        return access.createChatBotMessage({
          message: pickInfo.nextUser.name + ', you\'re up!'
        });
      } else {
        return access.createChatBotMessage({
          message: 'Draft is complete!'
        });
      }
    });
}

module.exports = {

  broadcastUndoPickMessage: function (draftPick, draft) {
    return loadPick(draft, draftPick)
      .then(function (pickInfo) {
        const {pickUser, pickGolfer} = pickInfo;
        const message = 'PICK REVERTED: ' + pickUser.name + ' picks ' + pickGolfer.name;
        return sendMessage(message, pickInfo);
      });
  },

  broadcastAutoPickMessage: function (draftPick, draft, isPickListPick) {
    return loadPick(draft, draftPick)
      .then(function (pickInfo) {
        const {pickUser, pickGolfer} = pickInfo;
        const message = pickUser.name + ' picks ' + pickGolfer.name + (isPickListPick ?
            ' (auto-draft from pick list)' :
            ' (auto-draft wgr)'
        );
        return sendMessage(message, pickInfo);
      });
  },

  broadcastProxyPickListPickMessage: function (currentUser, draftPick, draft) {
    return loadPick(draft, draftPick)
      .then(function (pickInfo) {
        const {pickUser, pickGolfer} = pickInfo;
        const message = pickUser.name + ' picks ' + pickGolfer.name + ' (pick list proxy from ' + currentUser.name + ')';
        return sendMessage(message, pickInfo);
      });
  },

  broadcastPickMessage: function (currentUser, draftPick, draft) {
    return loadPick(draft, draftPick)
      .then(function (pickInfo) {
        const {pickUser, pickGolfer} = pickInfo;
        const isProxyPick = utils.oidsAreEqual(pickUser._id, currentUser._id);

        let message = pickUser.name + ' picks ' + pickGolfer.name;
        if (isProxyPick) {
          message += ' (proxy from ' + currentUser.name + ')';
        }

        return sendMessage(message, pickInfo);
      });
  }

};
