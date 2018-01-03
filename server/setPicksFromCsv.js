'use strict';

const _ = require('lodash');
const access = require('./access');
const config = require('./config');
const mongoose = require('mongoose');
const fs = require('fs');
const Promise = require('promise');
const refreshPlayerState = require('./refreshPlayerState');
const constants = require('../common/constants');

function cleanName(n) {
  return n.toLowerCase().replace("-", "").replace("'", "");
}

function setPicksFromCsv(csvPicks) {
  console.log("reading: " + csvPicks);
  return new Promise(function (resolve, reject) {
    fs.readFile(csvPicks, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
        return reject(err);
      }

      const picks = _(data.split("\n"))
        .map(function (l) {
          return l.trim().split(",");
        })
        .filter(function (p) {
          return p.length === 2;
        })
        //.reverse()
        .value();

      const pickOrder = _(picks)
        .take(picks.length / constants.NGOLFERS)
        .pluck(0)
        .value();

      const playerLookup, golferLookup;
      return refreshPlayerState(pickOrder)
        .then(function () {
          return access.getPlayers();
        })
        .then(function (players) {
          playerLookup = _.indexBy(players, 'name');
        })
        .then(function () {
          return access.getGolfers();
        })
        .then(function (golfers) {
          golferLookup = _.indexBy(golfers, function (g) {
            return cleanName(g.name);
          });

          let curr = null;
          return Promise.all(_.map(picks, function (p, i) {
            const playerName = p[0];
            const golferName = cleanName(p[1]);

            const player = playerLookup[playerName];
            const golfer = golferLookup[golferName];

            if (!player) {
              console.log("Cannot find player: " + playerName);
              throw new Error();
            } else if (!golfer) {
              console.log("Cannot find golfer: " + golferName);
              throw new Error();
            }

            console.log('Making pick (' + i + ') - p:' + player.name + ' g:' + golfer.name);
            return access.makePick({
              pickNumber: i,
              player: player._id,
              golfer: golfer._id
            }, true /* ignoreOrder */);
          }));
        })
        .catch(function (err) {
          reject(err);
        })
        .then(function () {
          resolve();
        });
    });
  });
}

if (require.main === module) {
  if (process.argv.length != 3) {
    console.log('Usage: node setPicksFromCsv.js <csvfile>');
    process.exit(1);
  }

  //mongoose.set('debug', true);
  mongoose.connect(config.mongo_url);

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {
    setPicksFromCsv(process.argv[2])
      .catch(function (err) {
        console.log(err);
        process.exit(1);
      })
      .then(function () {
        process.exit(0);
      });
  });
}
