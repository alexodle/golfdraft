
import * as _ from 'lodash';
import * as access from './access';
import config from './config';
import * as mongoose from 'mongoose';
import * as fs from 'fs';
import refreshUserState from './refreshUserState';
import constants from '../common/constants';

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
        .map(0)
        .value();

      const userLookup, golferLookup;
      return refreshUserState(pickOrder)
        .then(function () {
          return access.getUsers();
        })
        .then(function (users) {
          userLookup = _.keyBy(users, 'name');
        })
        .then(function () {
          return access.getGolfers();
        })
        .then(function (golfers) {
          golferLookup = _.keyBy(golfers, function (g) {
            return cleanName(g.name);
          });

          let curr = null;
          return Promise.all(_.map(picks, function (p, i) {
            const userName = p[0];
            const golferName = cleanName(p[1]);

            const user = userLookup[userName];
            const golfer = golferLookup[golferName];

            if (!user) {
              console.log("Cannot find user: " + userName);
              throw new Error();
            } else if (!golfer) {
              console.log("Cannot find golfer: " + golferName);
              throw new Error();
            }

            console.log('Making pick (' + i + ') - p:' + user.name + ' g:' + golfer.name);
            return access.makePick({
              pickNumber: i,
              user: user._id,
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
