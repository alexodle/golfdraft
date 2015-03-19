'use strict';

var port = Number(process.env.PORT || 3000);

var _ = require('lodash');
var access = require('./access');
var app = require('./expressApp');
var bodyParser = require('body-parser');
var chatBot = require('./chatBot');
var compression = require('compression');
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

var MAX_AGE = 1000 * 60 * 60 * 24 * 365;

var redisCli = redis.client;
var ObjectId = mongoose.Types.ObjectId;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

// Temp state
var _isPaused = false;

// Request logging
app.use(logfmt.requestLogger());

// Redis
app.use(cookieParser()); // Must come before session()
app.use(session({
  store: new RedisStore({ url: config.redis_url }),
  secret: 'odle rules'
}));

// Gzip
app.use(compression());

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
  app.use('/dist', express.static(__dirname + '/../distd'));
} else {
  app.set('views', './dist/views/');
  app.use('/dist', express.static(__dirname + '/../dist', {
    maxAge: MAX_AGE
  }));
}
app.use('/assets', express.static(__dirname + '/../assets', {
  maxAge: MAX_AGE
}));

// Parsing
app.use(bodyParser());

function logRequest(req, cat, msg) {
  console.log(cat + ': ip:' + req.connection.remoteAddress + ' ' + msg);
}

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

  app.get(['/', '/draft', '/tourney', '/admin'], function (req, res) {
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
        prod: config.prod,
        cdnUrl: config.cdn_url
      });
    })
    .catch(function (err) {
      console.log(err);
      res.send(500, err);
    });
  });

  app.post('/login', function (req, res) {
    var body = req.body;
    logRequest(req, 'LOGIN.ATTEMPT', 'user: ' + body);

    req.session.user = body;
    req.session.save(function (err) {
      if (err) {
        logRequest(req, 'LOGIN.FAILURE', 'user: ' + body + ' err:' + err);
        res.send(500, err);
        return;
      }
      logRequest(req, 'LOGIN.SUCCESS', 'user: ' + body);
      res.send(200);
    });
  });

  app.post('/logout', function (req, res) {
    logRequest(req, 'LOGOUT.ATTEMPT', 'user: ' + req.session.user);

    req.session.user = null;
    req.session.save(function (err) {
      if (err) {
        logRequest(req, 'LOGOUT.FAILURE', 'user: ' + req.session.user);
        res.send(500, err);
        return;
      }
      logRequest(req, 'LOGOUT.SUCCESS', 'user: ' + req.session.user);
      res.send(200);
    });
  });

  app.post('/draft/picks', function (req, res) {
    var body = req.body;

    if (_isPaused) {
      res.send(400, 'Admin has paused the app');
      return;
    }

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

    // Make the pick
    access.makePick(pick)
    .then(function () {
      res.send(200);
    })
    .catch(function (err) {
      if (err.message.indexOf('invalid pick') !== -1) {
        res.send(400, err.message);
      }
      throw err;
    })

    // Alert clients
    .then(access.getDraft)
    .then(function (draft) {
      updateClients(draft);

      // Do this second, since it's least important
      chatBot.broadcastPickMessage(pick, draft);
    })
    .catch(function (err) {
      // The main functionality finished,
      // so don't return a failed response code
      console.log('err: ' + err);
    });
  });

  // ADMIN FUNCTIONALITY

  app.post('/admin/login', function (req, res) {
    if (req.body.password !== config.admin_password) {
      res.send(401, 'Bad password');
      return;
    }
    req.session.isAdmin = true;
    req.session.save(function (err) {
      if (err) {
        res.send(500, err);
        return;
      }
      res.send(200);
    });
  });

  app.put('/admin/pause', function (req, res) {
    if (!req.session.isAdmin) {
      res.send(401, 'Only can admin can pause the draft');
      return;
    }

    _isPaused = !!req.body.isPaused;
    io.sockets.emit('change:ispaused', {
      data: { isPaused: _isPaused }
    });
    res.send(200);
  });

  app.delete('/admin/lastpick', function (req, res) {
    if (!req.session.isAdmin) {
      res.send(401, 'Only can admin can undo picks');
      return;
    }

    access.undoLastPick()
    .then(function () {
      res.send(200);
    })
    .catch(function (err) {
      res.send(500, err);
      throw err;
    })

    // Alert clients
    .then(access.getDraft)
    .then(updateClients)
    .catch(function (err) {
      console.log('err: ' + err);
    });

  });

  app.put('/admin/forceRefresh', function (req, res) {
    if (!req.session.isAdmin) {
      res.send(401, 'Only can admin can force refreshes');
      return;
    }

    io.sockets.emit('action:forcerefresh');
    res.send(200);
  });

  function updateClients(draft) {
    io.sockets.emit('change:draft', {
      data: draft,
      evType: 'change:draft',
      action: 'draft:pick'
    });
  }

  require('./expressServer').listen(port);
  redisCli.subscribe("scores:update");

  console.log('I am fully running now!');
});
