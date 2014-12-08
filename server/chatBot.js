'use strict';

var _ = require('lodash');
var access = require('./access');
var Promise = require('promise');

module.exports = {

  broadcastPickMessage: function (draftPick, draft) {
    var nextPlayer = null;
    var nextPick = draft.pickOrder[draft.picks.length];

    Promise.all(_.compact([
      access.getPlayer(draftPick.player),
      access.getGolfer(draftPick.golfer),
      nextPick ? access.getPlayer(nextPick.player) : null,
    ]))
    .then(function (results) {
      var player = results[0];
      var golfer = results[1];
      nextPlayer = results[2];
      return access.createChatBotMessage({
        message: player.name + ' picks ' + golfer.name
      });
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
