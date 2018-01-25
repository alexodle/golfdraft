'use strict';

const _ = require('lodash');
const access = require('./access');
const app = require('./expressApp');
const requireSession = require('./authMiddleware').requireSession;
const bodyParser = require('body-parser');
const chatBot = require('./chatBot');
const compression = require('compression');
const config = require('./config');
const exphbs  = require('express-handlebars');
const express = require('express');
const io = require('./socketIO');
const logfmt = require("logfmt");
const mongooseUtil = require('./mongooseUtil');
const passport = require('passport');
const Promise = require('promise');
const redis = require("./redis");
const session = require('express-session');
const tourneyConfigReader = require('./tourneyConfigReader');
const User = require('./models').User;
const UserAccess = require('./userAccess');
const utils = require('../common/utils');

const RedisStore = require('connect-redis')(session);
const redisPubSubClient = redis.pubSubClient;

const port = Number(process.env.PORT || 3000);

const MAX_AGE = 1000 * 60 * 60 * 24 * 365;
const ENSURE_AUTO_PICK_DELAY_MILLIS = 500;
const AUTO_PICK_STARTUP_DELAY = 1000 * 5;

const NOT_AN_ERROR = {};

// Temp temp - remove this when we have multiple nodes
UserAccess.refresh();

// Request logging
app.use(logfmt.requestLogger());

// Session handling
const sessionMiddleware = session({
  store: new RedisStore({ url: config.redis_url }),
  secret: config.session_secret,
  maxAge: MAX_AGE,
  logErrors: true,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: !!config.prod }
});
app.use(sessionMiddleware);
io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

// Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(User.createStrategy());

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
app.use(function logSessionState(req, res, next) {
  try {
    const session = req.session;
    console.log(
      'ip=%s user=%j isAdmin=%s',
      req.connection.remoteAddress,
      req.user,
      !!session.isAdmin
    );
  } catch (e) {
    console.error(e);
  }
  next();
});

app.use(function updateUserActivity(req, res, next) {
  if (req.user) {
    UserAccess.onUserActivity(req.session.id, req.user._id);
  }
  next();
});

function defineRoutes() {
  const tourneyCfg = tourneyConfigReader.loadConfig();

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
        access.getUsers(),
        access.getDraft(),
        access.getScores(),
        access.getTourney(),
        access.getAppState()
      ])
      .then(function (results) {
        res.render('index', {
          golfers: JSON.stringify(results[0]),
          users: JSON.stringify(results[1]),
          draft: JSON.stringify(results[2]),
          scores: JSON.stringify(results[3]),
          tourney: JSON.stringify(results[4]),
          appState: JSON.stringify(results[5]),
          user: JSON.stringify(req.user),
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

  app.post('/register', function (req, res) {
    const { username, name, password } = req.body;
    User.register(new User({ username, name }), password, function (err) {
      if (err) {
        console.log('error while user register!', err);
        res.sendStatus(401);
        return;
      }

      res.status(200).send({ username });
    });
  });

  app.post('/login', passport.authenticate('local'), function (req, res, next) {
    res.status(200).send({ username: req.body.username });
  });

  app.post('/logout', function (req, res) {
    UserAccess.onUserLogout(req.session.id);
    req.logout();
    res.sendStatus(200);
  });

  app.get('/draft/pickList', requireSession(), function (req, res) {
    const user = req.user;

    access.getPickList(user._id)
      .then(function (pickList) {
        res.status(200).send({
          userId: user._id,
          pickList: pickList
        });
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).send(err);
      });
  });

  app.post('/draft/pickList', requireSession(), function (req, res) {
    const body = req.body;
    const user = req.user;

    let promise = null;
    if (body.pickList) {
      promise = access.updatePickList(user._id, body.pickList)
        .then(function () {
          res.status(200).send({ userId: user._id, pickList: body.pickList });
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).send(err);
          throw err;
        });

    } else {
      promise = access.updatePickListFromNames(user._id, body.pickListNames)
        .then(function (result) {
          if (result.completed) {
            res.status(200).send({ userId: user._id, pickList: result.pickList });
          } else {
            res.status(300).send({ userId: user._id, suggestions: result.suggestions });
          }
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).send(err);
          throw err;
        });
    }

    return promise;
  });

  app.put('/draft/autoPick', requireSession(), function (req, res) {
    const body = req.body;
    const user = req.user;

    const autoPick = !!body.autoPick;
    return onAppStateUpdate(req, res, access.updateAutoPick(user._id, autoPick));
  });

  app.post('/draft/picks', requireSession(), function (req, res) {
    const body = req.body;
    const user = req.user;

    const pick = {
      pickNumber: body.pickNumber,
      user: body.user,
      golfer: body.golfer
    };

    return handlePick({
      req,
      res,
      makePick: function () {
        return access.makePick(pick);
      },
      broadcastPickMessage: function (spec) {
        return chatBot.broadcastPickMessage(user, spec.pick, spec.draft);
      }
    });
  });

  app.post('/draft/pickPickListGolfer', requireSession(), function (req, res) {
    const body = req.body;
    const user = req.user;

    const forUser = body.user;
    const pickNumber = body.pickNumber;
    return handlePick({
      req,
      res,
      makePick: function () {
        return access.makePickListPick(forUser, pickNumber);
      },
      broadcastPickMessage: function (spec) {
        return chatBot.broadcastProxyPickListPickMessage(forUser, spec.pick, spec.draft);
      }
    });
  });

  // ADMIN FUNCTIONALITY

  app.post('/admin/login', requireSession(), function (req, res) {
    if (req.body.password !== config.admin_password) {
      res.status(401).send('Bad password');
      return;
    }

    req.session.isAdmin = true;
    req.session.save(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.sendStatus(200);
    });
  });

  app.put('/admin/autoPickUsers', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    const userId = req.body.userId;
    const autoPick = !!req.body.autoPick;
    return onAppStateUpdate(req, res, access.updateAutoPick(userId, autoPick));
  });

  app.put('/admin/pause', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    const isDraftPaused = !!req.body.isPaused;
    return onAppStateUpdate(req, res, access.updateAppState({ isDraftPaused: isDraftPaused }));
  });

  app.put('/admin/allowClock', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle clock');
      return;
    }

    const allowClock = !!req.body.allowClock;
    return onAppStateUpdate(req, res, access.updateAppState({ allowClock: allowClock }));
  });

  app.put('/admin/draftHasStarted', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle draft status');
      return;
    }

    const draftHasStarted = !!req.body.draftHasStarted;
    return onAppStateUpdate(req, res, access.updateAppState({ draftHasStarted: draftHasStarted }));
  });

  app.delete('/admin/lastpick', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can undo picks');
      return;
    }

    return handlePick({
      force: true,

      req,
      res,
      makePick: function () {
        return access.undoLastPick();
      },
      broadcastPickMessage: function (spec) {
        return chatBot.broadcastUndoPickMessage(spec.pick, spec.draft);
      }
    });
  });

  app.put('/admin/forceRefresh', requireSession(), function (req, res) {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can force refreshes');
      return;
    }

    io.sockets.emit('action:forcerefresh');
    res.sendStatus(200);
  });
}

// HELPERS

function isDraftOver(draft) {
  const nextPickNumber = draft.picks.length;
  const nextPick = draft.pickOrder[nextPickNumber];
  return !nextPick;
}

function ensureNextAutoPick() {
  setTimeout(function () {
    console.info('ensureNextAutoPick: running');
    return ensureDraftIsRunning()
      .then(function (spec) {
        const {appState, draft} = spec;
        const {autoPickUsers} = appState;
        const nextPickNumber = draft.picks.length;
        const nextPick = draft.pickOrder[nextPickNumber];
        const nextPickUser = nextPick.user;

        if (utils.containsObjectId(autoPickUsers, nextPickUser)) {
          console.info('ensureNextAutoPick: making next pick!');
          autoPick(nextPickUser, nextPickNumber);
        } else {
          console.info('ensureNextAutoPick: not auto-picking; user not in auto-pick list. ' +
            'user: ' + nextPickUser + ', autoPickUsers: ' + autoPickUsers);
        }
      })
      .catch(function (err) {
        if (err === NOT_AN_ERROR) {
          console.info('ensureNextAutoPick: not auto-picking; draft is not running.');
          throw err;
        }
        console.log(err);
      });
  }, ENSURE_AUTO_PICK_DELAY_MILLIS);
}

function autoPick(userId, pickNumber) {
  console.info('autoPick: Auto-picking for ' + userId + ', ' + pickNumber);
  let isPickListPick = null;
  return handlePick({
    makePick: function () {
      return access.makePickListPick(userId, pickNumber)
        .then(function (result) {
          isPickListPick = result.isPickListPick;
          return result;
        });
    },
    broadcastPickMessage: function (spec) {
      return chatBot.broadcastAutoPickMessage(spec.pick, spec.draft, isPickListPick);
    }
  });
}

function ensureDraftIsRunning(req, res) {
  return Promise.all([
      access.getAppState(),
      access.getDraft()
    ])
    .then(function (results) {
      const [appState, draft] = results;
      if (isDraftOver(draft) || appState.isDraftPaused || !appState.draftHasStarted) {
        if (res) {
          res.status(400).status('Draft is not active');
        }
        throw NOT_AN_ERROR;
      }

      return { appState, draft };
    });
}

function handlePick(spec) {
  const {res, makePick, broadcastPickMessage, force} = spec;
  let pick = null;

  const promise = !force ? ensureDraftIsRunning() : Promise.resolve();
  return promise
    .then(makePick)
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;

      if (res) {
        if (err.message.indexOf('invalid pick') !== -1) {
          res.status(400).send(err);
        } else {
          res.status(500).send(err);
        }
      }

      throw err;
    })
    .then(function (_pick) {
      pick = _pick;
      if (res) {
        res.sendStatus(200);
      }
      return access.getDraft();
    })
    .then(function (draft) {
      updateClients(draft);
      return broadcastPickMessage({ pick, draft });
    })
    .then(ensureNextAutoPick)
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;
      console.log(err);
    });
}

function onAppStateUpdate(req, res, promise) {
  return promise
    .catch(function (err) {
      console.log(err);
      res.status(500).send(err);
      throw NOT_AN_ERROR; // skip next steps
    })
    .then(function () {
      res.sendStatus(200);

      // App state will affect whether or not we should be running auto picks
      // SET AND FORGET
      ensureNextAutoPick();

      return access.getAppState();
    })
    .then(function (appState) {
      io.sockets.emit('change:appstate', {
        data: { appState: appState }
      });
    })
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;
      console.log(err);
    });
}

function updateClients(draft) {
  io.sockets.emit('change:draft', {
    data: draft,
    evType: 'change:draft',
    action: 'draft:pick'
  });
}

mongooseUtil.connect()
  .then(defineRoutes)
  .then(function () {
    app.use(function (err, req, res, next) {
      if (err) {
        console.log(err);
        next();
      }
    });

    require('./expressServer').listen(port);
    redisPubSubClient.subscribe("scores:update");

    // Give some time to settle, and then start ensuring we run auto picks
    setTimeout(ensureNextAutoPick, AUTO_PICK_STARTUP_DELAY);

    console.log('I am fully running now!');
  })
  .catch(function (err) {
    console.log(err);
    mongooseUtil.close();
  });
