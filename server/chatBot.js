'use strict';

const _ = require('lodash');
const access = require('./access');
const Promise = require('promise');

function getData(draft, draftPick) {
  const nextPick = draft.pickOrder[draft.picks.length];
  return Promise.all(_.compact([
      access.getPlayer(draftPick.player),
      access.getGolfer(draftPick.golfer),
      nextPick ? access.getPlayer(nextPick.player) : null,
    ]))
    .then(function (results){
      return {
        player: results[0],
        golfer: results[1],
        nextPlayer: results[2]
      };
    });
}

function sendMessage(message, data) {
  return access.createChatBotMessage({ message: message})
    .then(function () {
      if (data.nextPlayer) {
        return access.createChatBotMessage({
          message: data.nextPlayer.name + ', you\'re up!'
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
    return getData(draft, draftPick)
      .then(function (data) {
        const {player, golfer} = data;
        const message = 'PICK REVERTED: ' + player.name + ' picks ' + golfer.name;
        return sendMessage(message, data);
      });
  },

  broadcastAutoPickMessage: function (draftPick, draft, isPickListPick) {
    return getData(draft, draftPick)
      .then(function (data) {
        const {player, golfer} = data;
        const message = player.name + ' picks ' + golfer.name + (isPickListPick ? 
            ' (auto-draft from pick list)' :
            ' (auto-draft wgr)'
        );
        return sendMessage(message, data);
      });
  },

  broadcastProxyPickListPickMessage: function (user, draftPick, draft) {
    return getData(draft, draftPick)
      .then(function (data) {
        const {player, golfer} = data;
        const message = player.name + ' picks ' + golfer.name + ' (pick list proxy from ' + user.name + ')';
        return sendMessage(message, data);
      });
  },

  broadcastPickMessage: function (user, draftPick, draft) {
    return getData(draft, draftPick)
      .then(function (data) {
        const {player, golfer} = data;
        const isProxyPick = draftPick.player !== user.player;

        let message = player.name + ' picks ' + golfer.name;
        if (isProxyPick) {
          message += ' (proxy from ' + user.name + ')';
        }

        return sendMessage(message, data);
      });
  }

};
