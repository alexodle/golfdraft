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
var exphbs  = require('express-handlebars');
var express = require('express');
var io = require('./socketIO');
var logfmt = require("logfmt");
var mongoose = require('mongoose');
var Promise = require('promise');
var redis = require("./redis");
var session = require('express-session');
var tourneyConfigReader = require('./tourneyConfigReader');
var UserAccess = require('./userAccess');

var RedisStore = require('connect-redis')(session);

var MAX_AGE = 1000 * 60 * 60 * 24 * 365;

var NOT_AN_ERROR = {};

var redisPubSubClient = redis.pubSubClient;

mongoose.connect(config.mongo_url);

// Temp temp - remove this when we have multiple nodes
UserAccess.refresh();

// Request logging
app.use(logfmt.requestLogger());

// Middlewares
var sessionMiddleware = session({
  store: new RedisStore({ url: config.redis_url }),
  secret: 'odle rules'
});
app.use(cookieParser()); // Must come before session()
app.use(sessionMiddleware);
io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

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
if (!config.prod) {
  mongoose.set('debug', true);
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

// Log session state on every request
function logSessionState(req, res, next) {
  try {
    var session = req.session;
    console.log(
      'ip=%s user=%j isAdmin=%s',
      req.connection.remoteAddress,
      session.user,
      !!session.isAdmin
    );
  } catch (e) {
    console.error(e);
  }
  next();
}
app.use(logSessionState);

var tourneyCfg = tourneyConfigReader.loadConfig();

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {

  redisPubSubClient.on("message", function (channel, message) {
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

  // Include socket server
  require('./socketServer');

  // Support legacy urls
  app.get(/\/tourney\/?/, function (req, res) {
    res.redirect('/');
  });

  app.get(['/', '/draft', '/admin', '/whoisyou'], function (req, res) {
    Promise.all([
      access.getGolfers(),
      access.getPlayers(),
      access.getDraft(),
      access.getScores(),
      access.getTourney(),
      access.getAppState()
    ])
    .then(function (results) {
      res.render('index', {
        golfers: JSON.stringify(results[0]),
        players: JSON.stringify(results[1]),
        draft: JSON.stringify(results[2]),
        scores: JSON.stringify(results[3]),
        tourney: JSON.stringify(results[4]),
        appState: JSON.stringify(results[5]),
        user: JSON.stringify(req.session.user),
        tourneyName: tourneyCfg.name,
        prod: config.prod,
        cdnUrl: config.cdn_url
      });
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).send(err);
    });
  });

  app.get('/bootstrap', function (req, res) {
    Promise.all([
      access.getGolfers(),
      access.getPlayers(),
      access.getDraft(),
      access.getScores(),
      access.getTourney(),
      access.getAppState()
    ])
    .then(function (results) {
      res.send({
        golfers: results[0],
        players: results[1],
        draft: results[2],
        scores: results[3],
        tourney: results[4],
        appState: results[5],
        tourneyName: tourneyCfg.name,
        user: req.session.user
      });
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).send(err);
    });
  });

  app.post('/login', function (req, res) {
    var user = req.body;
    req.session.user = user;
    req.session.save(function (err) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      UserAccess.onUserLogin(req.session);
      res.sendStatus(200);
    });
  });

  app.post('/logout', function (req, res) {
    req.session.user = null;

    req.session.save(function (err) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      UserAccess.onUserLogout(req.session);
      res.sendStatus(200);
    });
  });

  app.get('/draft/priority', function (req, res) {
    var user = req.session.user;

    if (!user || !user.id) {
      res.status(401).send('Must be logged in to get draft priority');
      return;
    }

    access.getPriority(user.id)
    .then(function (priority) {
      res.status(200).send({
        playerId: user.id,
        priority: priority
      });
    })
    .catch(function (err) {
      res.status(500).send(err);
    });
  });

  app.post('/draft/priority', function (req, res) {
    var body = req.body;
    var user = req.session.user;

    if (!user || !user.id) {
      res.status(401).send('Must be logged in to set draft priority');
      return;
    }

    var priority = body.priority;
    access.updatePriority(user.id, priority)
    .catch(function (err) {
      res.status(500).send(err);
    })
    .then(function () {
      res.status(200).send({ playerId: user.id });
    });
  });

  function ensureNotPaused(req, res) {
    return access.getAppState()
    .then(function (appState) {
      if (appState && appState.isDraftPaused) {
        res.status(400).status('Admin has paused the app');
        throw NOT_AN_ERROR;
      }
    });
  }

  function handlePick(req, res, pickPromise, highestPriPick) {
    var user = req.session.user;
    var pick = null;

    return pickPromise.then(function (_pick) {
      pick = _pick;
      res.sendStatus(200);
    })
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;

      if (err.message.indexOf('invalid pick') !== -1) {
        res.status(400).send(err.message);
      }
      throw err;
    })

    // Alert clients
    .then(access.getDraft)
    .then(function (draft) {
      updateClients(draft);

      // Do this second, since it's least important
      chatBot.broadcastPickMessage(user, pick, draft, highestPriPick);
    })
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;

      // The main functionality finished,
      // so don't return a failed response code
      console.log('err: ' + err);
    });
  }

  app.post('/draft/picks', function (req, res) {
    var body = req.body;
    var user = req.session.user;

    if (!user || !user.id) {
      res.status(401).send('Must be logged in to make a pick');
      return;
    }

    var pick = {
      pickNumber: body.pickNumber,
      player: body.player,
      golfer: body.golfer
    };

    var pickPromise = ensureNotPaused(req, res)
    .then(function () {
      return access.makePick(pick);
    });

    handlePick(req, res, pickPromise, false /* highestPriPick */);
  });

  app.post('/draft/pickHighestPriGolfer', function (req, res) {
    var body = req.body;
    var user = req.session.user;

    if (!user || !user.id) {
      res.status(401).send('Must be logged in to make a pick');
      return;
    }

    var pickPromise = ensureNotPaused(req, res)
    .then(function () {
      return access.makeHighestPriorityPick(body.player, body.pickNumber);
    });
    
    handlePick(req, res, pickPromise, true /* highestPriPick */);
  });

  // ADMIN FUNCTIONALITY

  app.post('/admin/login', function (req, res) {
    if (req.body.password !== config.admin_password) {
      res.status(401).send('Bad password');
      return;
    }
    req.session.isAdmin = true;
    req.session.save(function (err) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.sendStatus(200);
    });
  });

  app.put('/admin/pause', function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    var isDraftPaused = !!req.body.isPaused;
    access.updateAppState({
      isDraftPaused: isDraftPaused
    })
    .then(function () {
      io.sockets.emit('change:ispaused', {
        data: { isPaused: isDraftPaused }
      });
      res.sendStatus(200);
    });
  });

  app.put('/admin/allowClock', function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle clock');
      return;
    }

    var allowClock = !!req.body.allowClock;
    access.updateAppState({
      allowClock: allowClock
    })
    .then(function () {
      io.sockets.emit('change:allowclock', {
        data: { allowClock: allowClock }
      });
      res.sendStatus(200);
    });
  });

  app.delete('/admin/lastpick', function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can undo picks');
      return;
    }

    access.undoLastPick()
    .then(function () {
      res.sendStatus(200);
    })
    .catch(function (err) {
      res.status(500).send(err);
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
      res.status(401).send('Only can admin can force refreshes');
      return;
    }

    io.sockets.emit('action:forcerefresh');
    res.sendStatus(200);
  });

  function updateClients(draft) {
    io.sockets.emit('change:draft', {
      data: draft,
      evType: 'change:draft',
      action: 'draft:pick'
    });
  }

  require('./expressServer').listen(port);
  redisPubSubClient.subscribe("scores:update");

  console.log('I am fully running now!');
});
