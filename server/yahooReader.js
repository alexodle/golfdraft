var _ = require('lodash');
var constants = require('../common/constants');
var jsdom = require('jsdom');
var Promise = require('promise');

var DEFAULT_YSURL = "http://sports.yahoo.com/golf/pga/leaderboard";
var MISSED_CUT = constants.MISSED_CUT;

function eachGolferCb(callback) {
  return function (tourney) {
    var newGolfers = _.map(tourney.golfers, function (g) {
      callback(g, tourney);
    });
    return tourney;
  };
}

var YahooReader = {

  readUrl: function (yahooUrl) {
    yahooUrl = yahooUrl || DEFAULT_YSURL;
    console.log('YahooReader - updating score from: ' + yahooUrl);
    return new Promise(function (fulfill, reject) {
      jsdom.env(
        yahooUrl,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
          if (errors) {
            console.log("Error retrieving: " + yahooUrl);
            reject(new Error(JSON.stringify(errors)));
            return;
          }
          var $ = window.$;
          var par = parseInt($("li.par span").text(), 10);
          var golfers = [];

          $("#leaderboardtable table.sportsTable tbody tr").each(function () {
            var $tr = $(this);
            var $td = $("td.player", $tr);

            var golfer = $("a", $td).text().trim()
              .replace("*", "")
              .replace("x-", "");
            if (!golfer) {
              return;
            }

            var scores = _.times(4, function () {
              return $($td = $td.next()).text().trim();
            });
            var today = $($td = $td.next()).text().trim();
            var thru = $($td = $td.next()).text().trim();

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
      } else if (_.contains([MISSED_CUT, "WD", "MDF", "DQ", "CUT"], s)) {
        return MISSED_CUT;
      } else {
        day++;
        return parseInt(s, 10);
      }
    });

    var missedCut = _.contains(g.scores, MISSED_CUT);
    if (missedCut) {
      g.day = g.scores.length;
    } else {
      g.day = g.thru === "F" || g.thru === "-" ? day : day - 1;
    }

    return g;
  },

  relativeToPar: function (g, tourney) {
    var par = tourney.par;
    var missedCut = _.contains(g.scores, MISSED_CUT);
    if (g.today === "E") {
      g.today = 0;
    }
    g.scores = _.map(g.scores, function (s, i) {
      if (s === MISSED_CUT) {
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

  run: function (yahooUrl) {
    function printState(state) {
      return function (tourney) {
        console.log("Contents (" + state + "):");
        console.log(JSON.stringify(tourney));
        console.log("");
        return tourney;
      };
    }

    return this.readUrl(yahooUrl)
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
