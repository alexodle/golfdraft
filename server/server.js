'use strict';

var port = Number(process.env.PORT || 3000);

var _ = require('lodash');
var access = require('./access');
var app = require('./expressApp');
var bodyParser = require('body-parser');
var config = require('./config');
var cookieParser = require('cookie-parser');
var exphbs  = require('express3-handlebars');
var express = require('express');
var io = require('./socketIO');
var logfmt = require("logfmt");
var mongoose = require('mongoose');
var Promise = require('promise');
var redis = require("./redis");
var session = require('express-session');

var RedisStore = require('connect-redis')(session);

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
if (process.env.DEBUG) {
  app.set('views', './distd/views/');
  app.use('/distd', express.static(__dirname + '/../distd'));
} else {
  app.set('views', './dist/views/');
  app.use('/dist', express.static(__dirname + '/../dist'));
}
app.use('/assets', express.static(__dirname + '/../assets'));

// Parsing
app.use(bodyParser());

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {

  redisCli.on("message", function (channel, message) {
    // Scores updated, alert clients
    console.log("redis message: channel " + channel + ": " + message);
    access.getScores().then(function (scores) {
      io.sockets.emit('change:scores', {
        data: {
          scores: scores,
          lastUpdated: new Date()
        },
        evType: 'change:scores',
        action: 'scores:periodic_update'
      });
    });
  });

  // Include chat routes
  require('./chatRoutes');

  app.get(/\/(draft|tourney)?/, function (req, res) {
    Promise.all([
      access.getGolfers(),
      access.getPlayers(),
      access.getDraft(),
      access.getScores(),
      access.getTourney()
    ])
    .then(function (results) {
      res.render('index', {
        golfers: JSON.stringify(results[0]),
        players: JSON.stringify(results[1]),
        draft: JSON.stringify(results[2]),
        scores: JSON.stringify(results[3]),
        tourney: JSON.stringify(results[4]),
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
    access.makePick(pick)
    .then(function () {
      access.getDraft().then(function (draft) {
        io.sockets.emit('change:draft', {
          data: draft,
          evType: 'change:draft',
          action: 'draft:pick'
        });
        res.send(200);
      });
    })
    .catch(function (err) {
      if (err.message.indexOf('invalid pick') !== -1) {
        res.send(400, err.message);
      }
    });
  });

  require('./expressServer').listen(port);
  redisCli.subscribe("scores:update");

  console.log('I am fully running now!');
});
