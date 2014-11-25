'use strict';

var port = Number(process.env.PORT || 3000);

var _ = require('lodash');
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var exphbs  = require('express3-handlebars');
var bodyParser = require('body-parser');
var access = require('./access');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var cookieParser = require('cookie-parser');
var logfmt = require("logfmt");
var server = require("http").createServer(app);
var io = require('socket.io').listen(server);
var config = require('./config');
var redis = require("./redis");
var Promise = require('promise');

var redisCli = redis.client;
var ObjectId = mongoose.Types.ObjectId;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

// Request logging
app.use(logfmt.requestLogger());

// Redis
app.use(cookieParser()); // Must come before session()
app.use(session({
  store: new RedisStore({ url: config.redis_url }),
  secret: 'odle rules'
}));

// Handlebars
app.engine('handlebars', exphbs({
  helpers: {
    or: function (a, b) { return a || b; }
  }
}));
app.set('view engine', 'handlebars');

// Static routes
app.use('/', express.static(__dirname + '/../distd'));
app.use('/assets', express.static(__dirname + '/../assets'));

// Parsing
app.use(bodyParser());

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {

  redisCli.on("message", function (channel, message) {
    // Scores updated, alert clients
    console.log("redis message: channel " + channel + ": " + message);
    access.getTourney().then(function (tourney) {
      io.sockets.emit('change:scores', {
        data: {
          scores: tourney.scores,
          lastUpdated: tourney.lastUpdated
        },
        evType: 'change:scores',
        action: 'scores:periodic_update'
      });
    });
  });

  app.get(/\/(draft|tourney)?/, function (req, res) {
    Promise.all([
      access.getGolfers(),
      access.getPlayers(),
      access.getDraft(),
      access.getTourney()
    ])
    .then(function (results) {
      res.render('index', {
        golfers: JSON.stringify(results[0]),
        players: JSON.stringify(results[1]),
        draft: JSON.stringify(results[2]),
        tourney: JSON.stringify(results[3]),
        user: JSON.stringify(req.session.user),
        prod: config.prod
      });
    });
  });

  app.post('/login', function (req, res) {
    var body = req.body;
    req.session.user = body;
    req.session.save(function (err) {
      if (err) {
        res.send(500, err);
        return;
      }
      res.send(200);
    });
  });

  app.post('/logout', function (req, res) {
    req.session.user = null;
    req.session.save(function (err) {
      if (err) {
        res.send(500, err);
        return;
      }
      res.send(200);
    });
  });

  app.post('/draft/picks', function (req, res) {
    var body = req.body;

    var user = req.session.user;
    if (!user || body.player !== user.player) {
      console.log('401 - Request from user: ' + JSON.stringify(user) + ' not allowed to pick for player: "' + body.player + '"');
      res.send(401, 'Picked from wrong player.');
      return;
    }

    var pick = {
      pickNumber: body.pickNumber,
      player: new ObjectId(body.player),
      golfer: new ObjectId(body.golfer)
    };
    var draftQuery = { _id: config.tourney_id };

    draftQuery['draft.picks.' + pick.pickNumber] = { $exists: false };
    if (pick.pickNumber > 0) {
      draftQuery['draft.picks.' + (pick.pickNumber - 1)] = { $exists: true };
    }

    draftQuery['draft.pickOrder.' + pick.pickNumber] = pick.player;

    draftQuery.golfers = {
       $elemMatch: { _id: pick.golfer }
    };
    draftQuery['draft.picks'] = {
      $not: { $elemMatch: { golfer: pick.golfer } }
    };

    console.log(JSON.stringify(draftQuery));
    Tourney.findOneAndUpdate(draftQuery,
      { $push: { "draft.picks": pick } }, {},
      function (err, result) {
        if (!result) {
          res.send(400, 'Invalid pick');
          return;
        }
        if (err) {
          res.send(500, err);
          return;
        }
        console.log("hihi result: " + JSON.stringify(result));
        io.sockets.emit('change:draft', {
          data: result.draft,
          evType: 'change:draft',
          action: 'draft:pick'
        });
        res.send(200);
      }
    );
  });

  server.listen(port);
  redisCli.subscribe("scores:update");
});
