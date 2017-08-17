'use strict';

var _ = require('lodash');
var access = require('./access');
var Promise = require('promise');
var exec = require('child_process').exec;
var tourneyCfg = require('./tourneyConfigReader').loadConfig();

module.exports = {

  broadcastPickMessage: function (user, draftPick, draft) {
    var nextPlayer = null;
    var nextPick = draft.pickOrder[draft.picks.length];

    // draftPick.player is an ObjectId, so use its equals() method
    var isProxyPick = !draftPick.player.equals(user.player);

    Promise.all(_.compact([
      access.getPlayer(draftPick.player),
      access.getGolfer(draftPick.golfer),
      nextPick ? access.getPlayer(nextPick.player) : null,
    ]))
    .then(function (results) {
      var player = results[0];
      var golfer = results[1];
      nextPlayer = results[2];

      var message = !isProxyPick ?
        player.name + ' picks ' + golfer.name :
        player.name + ' picks ' + golfer.name + ' (proxy from ' + user.name + ')';
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
    })
    .then(function() {
      // externalized notifications
      if (nextPlayer) {
        var notify = tourneyCfg.notifications[nextPlayer.name];
        if (notify && tourneyCfg.commands[notify[0]]) {
          var cmd = tourneyCfg.commands[notify[0]];
          cmd = cmd.replace("{{email}}",notify[1]);
          cmd = cmd.replace("{{subject}}", "You are up.");
          cmd = cmd.replace("{{text}}", "Make it a good one.");
          exec(cmd, function (err, stdout, stderr) {
            if (err) {
              console.log(err);
            }
            else {
              console.log('player notified');
            }
            return true;
          });
        }
      }
      return true;
    });
  }

};
