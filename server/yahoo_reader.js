var jsdom = require('jsdom');
var Promise = require('promise');
var _ = require('underscore');

var YSURL = "http://sports.yahoo.com/golf/pga/leaderboard/2014/13";

function eachGolferCb(callback) {
  return function (tourney) {
    var newGolfers = _.map(tourney.golfers, function (g) {
      callback(g, tourney);
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
          var golfers = [];

          $("#leaderboardtable table.sportsTable tbody tr").each(function () {
            var tds = $("td", this);
            var golfer = $(tds[1]).text().trim().replace("*", "");
            if (!golfer) {
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

            golfers.push({
              golfer: golfer,
              scores: scores,
              thru: thru,
              today: today
            });
          });
          fulfill({
            par: par,
            golfers: golfers
          });
        }
      );
    });
  },

  parseScores: function (g) {
    var day = 0;
    g.scores = _.map(g.scores, function (s) {
      if (
        s.toLowerCase().indexOf("pm") !== -1 ||
        s.toLowerCase().indexOf("am") !== -1 ||
        s === "-"
      ) {
        return 0;
      } else if (_.contains(["MC", "WD", "MDF", "DQ", "CUT"], s)) {
        return "MC";
      } else {
        day++;
        return parseInt(s, 10);
      }
    });

    var missedCut = _.contains(g.scores, "MC");
    if (missedCut) {
      g.day = g.scores.length;
    } else {
      g.day = g.thru === "F" || g.thru === "-" ? day : day - 1;
    }

    return g;
  },

  relativeToPar: function (g, tourney) {
    var par = tourney.par;
    var missedCut = _.contains(g.scores, "MC");
    if (g.today === "E") {
      g.today = 0;
    }
    g.scores = _.map(g.scores, function (s, i) {
      if (s === "MC") {
        return s;
      } else if (i < g.day) {
        return s - par;
      } else {
        return s;
      }
    });
    if (!missedCut && g.thru !== "F" && g.thru !== "-") {
      g.scores[g.day] = parseInt(g.today, 10);
    }
    return g;
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
    .then(eachGolferCb(this.parseScores))
    .then(printState("Parse scores"))
    .then(eachGolferCb(this.relativeToPar))
    .then(printState("Relative to par"),
      function (e) {
        console.log(e);
        return null;
      }
    );
  }

};


module.exports = YahooReader;
