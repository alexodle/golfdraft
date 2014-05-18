var jsdom = require('jsdom');
var Promise = require('promise');
var _ = require('underscore');

var YSURL = "http://sports.yahoo.com/golf/pga/leaderboard";

function eachPlayerCb(callback) {
  return function (tourney) {
    var newPlayers = _.map(tourney.players, function (p) {
      callback(p, tourney);
    });
    return tourney;
  };
}

var YahooReader = {

  readUrl: function () {
    return new Promise(function (fulfill, reject) {
      jsdom.env(
        YSURL,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
          if (errors) {
            console.log("Error retrieving: " + YSURL);
            reject(new Error(JSON.stringify(errors)));
            return;
          }
          var $ = window.$;
          var par = parseInt($("li.par span").text(), 10);
          var players = [];

          $("#leaderboardtable table.sportsTable tbody tr").each(function () {
            var tds = $("td", this);
            var player = $(tds[1]).text().trim();
            if (!player) {
              return;
            }

            var scores = [
              $(tds[2]).text().trim(),
              $(tds[3]).text().trim(),
              $(tds[4]).text().trim(),
              $(tds[5]).text().trim()
            ];
            var today = $(tds[6]).text().trim();
            var thru = $(tds[7]).text().trim();

            players.push({
              player: player,
              scores: scores,
              thru: thru,
              today: today
            });
          });
          fulfill({
            par: par,
            players: players
          });
        }
      );
    });
  },

  parseScores: function (p) {
    var day = 0;
    p.scores = _.map(p.scores, function (s) {
      if (
        s.toLowerCase().indexOf("pm") !== -1 ||
        s.toLowerCase().indexOf("am") !== -1 ||
        s === "-"
      ) {
        return 0;
      } else if (_.contains(["MC", "WD", "MDF", "DQ"], s)) {
        return "MC";
      } else {
        day++;
        return parseInt(s, 10);
      }
    });

    var missedCut = _.contains(p.scores, "MC");
    if (missedCut) {
      p.day = p.scores.length;
    } else {
      p.day = p.thru === "F" || p.thru === "-" ? day : day - 1;
    }

    return p;
  },

  relativeToPar: function (p, tourney) {
    var par = tourney.par;
    var missedCut = _.contains(p.scores, "MC");
    if (p.today === "E") {
      p.today = 0;
    }
    p.scores = _.map(p.scores, function (s, i) {
      if (s === "MC") {
        return s;
      } else if (i < p.day) {
        return s - par;
      } else {
        return s;
      }
    });
    if (!missedCut && p.thru !== "F" && p.thru !== "-") {
      p.scores[p.day] = parseInt(p.today, 10);
    }
    return p;
  },

  adjustMissedCutScores: function (players) {
    function worstScore(day) {
      var player = _.chain(players)
        .filter(function (p) { return p.scores[day] !== "MC"; })
        .max(function (p) { return p.scores[day]; })
        .value();
      return player.scores[day];
    }
    var worstScores = _.map(_.range(players[0].scores.length), worstScore);
    _.each(players, function (p) {
      p.scores = _.map(p.scores, function (s, i) {
        return s === "MC" ? worstScores[i] : s;
      });
    });
    return players;
  },

  run: function () {
    function printState(state) {
      return function (tourney) {
        console.log("Contents (" + state + "):");
        console.log(JSON.stringify(tourney));
        console.log("");
        return tourney;
      };
    }

    return this.readUrl()
    .then(printState("Raw"))
    .then(eachPlayerCb(this.parseScores))
    .then(printState("Parse scores"))
    .then(eachPlayerCb(this.relativeToPar))
    .then(printState("Relative to par"))
    .then(function (tourney) {
      tourney.players = this.adjustMissedCutScores(tourney.players);
      return tourney;
    }.bind(this))
    .then(printState("Adjust missed cut"),
    function (e, tb) {
      console.log(e);
      return null;
    });
  }

};


module.exports = YahooReader;
