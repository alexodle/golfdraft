'use strict';

const _ = require('lodash');
const access = require('./access');
const Promise = require('promise');

module.exports = {

  broadcastPickMessage: function (user, draftPick, draft, highestPriPick) {
    let nextPlayer = null;
    const nextPick = draft.pickOrder[draft.picks.length];

    const isProxyPick = draftPick.player !== user.player;

    Promise.all(_.compact([
      access.getPlayer(draftPick.player),
      access.getGolfer(draftPick.golfer),
      nextPick ? access.getPlayer(nextPick.player) : null,
    ]))
    .then(function (results) {
      const player = results[0];
      const golfer = results[1];
      nextPlayer = results[2];

      let message = null;
      if (isProxyPick) {
        if (highestPriPick) {
          message = player.name + ' picks ' + golfer.name + ' (priority proxy from ' + user.name + ')';
        } else {
          message = player.name + ' picks ' + golfer.name + ' (proxy from ' + user.name + ')';
        }
      } else {
        message = player.name + ' picks ' + golfer.name;
      }

      return access.createChatBotMessage({ message: message });
    })
    .then(function () {
      if (nextPlayer) {
        return access.createChatBotMessage({
          message: nextPlayer.name + ', you\'re up!'
        });
      } else {
        return access.createChatBotMessage({
          message: 'Draft is complete!'
        });
      }
    });
  }

};
