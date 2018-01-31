import * as _ from 'lodash';
import * as access from './access';
import * as bodyParser from 'body-parser';
import * as chatBot from './chatBot';
import * as compression from 'compression';
import * as connectRedis from 'connect-redis';
import * as exphbs  from 'express-handlebars';
import * as express from 'express';
import expressServer from './expressServer';
import * as mongooseUtil from './mongooseUtil';
import * as passport from 'passport';
import * as session from 'express-session';
import * as tourneyConfigReader from './tourneyConfigReader';
import * as userAccess from './userAccess';
import * as utils from '../common/utils';
import app from './expressApp';
import config from './config';
import io from './socketIO';
import redis from './redis';
import {requireSession} from './authMiddleware';
import {User} from './models';
import {Request, Response, NextFunction} from 'express';
import {
  AppSettings,
  Draft,
  DraftPick,
  DraftPickDoc,
} from './ServerTypes';

const RedisStore = connectRedis(session);
const redisPubSubClient = redis.pubSubClient;

const port = Number(process.env.PORT || 3000);

const MAX_AGE = 1000 * 60 * 60 * 24 * 365;
const ENSURE_AUTO_PICK_DELAY_MILLIS = 500;
const AUTO_PICK_STARTUP_DELAY = 1000 * 5;

const NOT_AN_ERROR = {};

// Temp temp - remove this when we have multiple nodes
userAccess.refresh();

// Session handling
const sessionMiddleware = session({
  store: new RedisStore({ url: config.redis_url }),
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !!config.prod,
    maxAge: MAX_AGE
  }
});
app.use(sessionMiddleware);
io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

// Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((<any>User).serializeUser());
passport.deserializeUser((<any>User).deserializeUser());
passport.use((<any>User).createStrategy());

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

// Global error handling
app.use(function erroHandler(err, req: Request, res: Response, next: NextFunction) {
  if (err) {
    console.log(err);
    res.status(500).send(err);
  } else {
    next();
  }
});

// Log session state on every request
app.use(function logSessionState(req: Request, res: Response, next: NextFunction) {
  try {
    const session = req.session;
    console.log(
      'ip=%s user=%j isAdmin=%s',
      req.connection.remoteAddress,
      req.user && req.user.username,
      !!session.isAdmin
    );
  } catch (e) {
    console.error(e);
  }
  next();
});

app.use(function updateUserActivity(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    userAccess.onUserActivity(req.session.id, req.user._id.toString());
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
  app.get(/\/tourney\/?/, (req: Request, res: Response, next: NextFunction) => {
    res.redirect('/');
  });

  app.get(['/', '/draft', '/admin', '/whoisyou'], (req: Request, res: Response, next: NextFunction) => {
    return Promise.all([
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
      });
  });

  app.post('/register', (req: Request, res: Response, next: NextFunction) => {
    const { username, name, password } = req.body;
    (<any>User).register(new User({ username, name }), password, (err) => {
      if (err) {
        console.log('error while user register!', err);
        res.sendStatus(401);
        return;
      }

      res.status(200).send({ username });
    });
  });

  app.post('/login', passport.authenticate('local'), (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send({ username: req.body.username });
  });

  app.post('/logout', (req: Request, res: Response, next: NextFunction) => {
    userAccess.onUserLogout(req.session.id);
    req.logout();
    res.status(200).send({ 'username': null });
  });

  app.get('/draft/pickList', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    return access.getPickList(user._id)
      .then(function (pickList) {
        res.status(200).send({
          userId: user._id,
          pickList: pickList
        });
      });
  });

  app.post('/draft/pickList', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const user = req.user;

    let promise = null;
    if (body.pickList) {
      access.updatePickList(user._id, body.pickList)
        .then(function () {
          res.status(200).send({ userId: user._id, pickList: body.pickList });
        })
        .catch(next);
    } else {
      access.updatePickListFromNames(user._id, body.pickListNames)
        .then(function (result) {
          if (result.completed) {
            res.status(200).send({ userId: user._id, pickList: result.pickList });
          } else {
            res.status(300).send({ userId: user._id, suggestions: result.suggestions });
          }
        })
        .catch(next);
    }
  });

  app.put('/draft/autoPick', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const user = req.user;

    const autoPick = !!body.autoPick;
    onAppStateUpdate(req, res, access.updateAutoPick(user._id, autoPick));
  });

  app.post('/draft/picks', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const user = req.user;

    const pick = {
      pickNumber: body.pickNumber,
      user: body.user,
      golfer: body.golfer
    } as DraftPick;

    return handlePick({
      res,
      makePick: function () {
        return access.makePick(pick);
      },
      broadcastPickMessage: function (spec) {
        return chatBot.broadcastPickMessage(user, spec.pick, spec.draft);
      }
    });
  });

  app.post('/draft/pickPickListGolfer', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const currentUuser = req.user;

    const forUser = body.user;
    const pickNumber = body.pickNumber;
    return handlePick({
      res,
      makePick: () => {
        return access.makePickListPick(forUser, pickNumber);
      },
      broadcastPickMessage: (spec) => {
        return chatBot.broadcastProxyPickListPickMessage(currentUuser, spec.pick, spec.draft);
      }
    });
  });

  // ADMIN FUNCTIONALITY

  app.post('/admin/login', requireSession(), (req: Request, res: Response, next: NextFunction) => {
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
      res.status(200).send({ username: req.user.username, isAdmin: true });
    });
  });

  app.put('/admin/autoPickUsers', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    const userId = req.body.userId;
    const autoPick = !!req.body.autoPick;
    return onAppStateUpdate(req, res, access.updateAutoPick(userId, autoPick));
  });

  app.put('/admin/pause', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    const isDraftPaused = !!req.body.isPaused;
    return onAppStateUpdate(req, res, access.updateAppState({ isDraftPaused } as AppSettings));
  });

  app.put('/admin/allowClock', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle clock');
      return;
    }

    const allowClock = !!req.body.allowClock;
    return onAppStateUpdate(req, res, access.updateAppState({ allowClock } as AppSettings));
  });

  app.put('/admin/draftHasStarted', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle draft status');
      return;
    }

    const draftHasStarted = !!req.body.draftHasStarted;
    return onAppStateUpdate(req, res, access.updateAppState({ draftHasStarted } as AppSettings));
  });

  app.delete('/admin/lastpick', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can undo picks');
      return;
    }

    return handlePick({
      force: true,
      res,
      makePick: () => {
        return access.undoLastPick();
      },
      broadcastPickMessage: (spec) => {
        return chatBot.broadcastUndoPickMessage(spec.pick, spec.draft);
      }
    });
  });

  app.put('/admin/forceRefresh', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can force refreshes');
      return;
    }

    io.sockets.emit('action:forcerefresh');
    res.status(200).send({ forceRefresh: true });
  });
}

// HELPERS

function isDraftOver(draft: Draft) {
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
          autoPick(nextPickUser.toString(), nextPickNumber);
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

function autoPick(userId: string, pickNumber: number) {
  console.info('autoPick: Auto-picking for ' + userId + ', ' + pickNumber);
  let isPickListPick = null;
  return handlePick({
    makePick: () => {
      return access.makePickListPick(userId, pickNumber)
        .then((result) => {
          isPickListPick = result.isPickListPick;
          return result;
        });
    },
    broadcastPickMessage: (spec) => {
      return chatBot.broadcastAutoPickMessage(spec.pick, spec.draft, isPickListPick);
    },
  });
}

function ensureDraftIsRunning(req?: Request, res?: Response): Promise<{ appState: AppSettings, draft: Draft }> {
  return Promise.all([
      access.getAppState(),
      access.getDraft()
    ])
    .then(function (results) {
      const [appState, draft] = results;
      if (isDraftOver(draft) || appState.isDraftPaused || !appState.draftHasStarted) {
        if (res) {
          res.status(400).send('Draft is not active');
        }
        throw NOT_AN_ERROR;
      }

      return { appState, draft };
    });
}

function handlePick(spec: {
  res?: Response,
  makePick: () => Promise<DraftPick>,
  broadcastPickMessage: ({ pick: DraftPick, draft: Draft }) => Promise<any>,
  force?: boolean
}) {
  const {res, makePick, broadcastPickMessage, force} = spec;

  const promise = (!force ? ensureDraftIsRunning() : Promise.resolve()) as Promise<any>;
  return promise
    .then(makePick)
    .catch((err) => {
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
    .then((pick) => {
      if (res) {
        res.status(200).send({ pick });
      }
      return access.getDraft()
        .then((draft) => {
          updateClients(draft);
          return broadcastPickMessage({ pick, draft });
        });
    })
    .then(ensureNextAutoPick)
    .catch(function (err) {
      if (err === NOT_AN_ERROR) throw err;
      console.log(err);
    });
}

function onAppStateUpdate(req: Request, res: Response, promise: Promise<any>) {
  return promise
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
      throw NOT_AN_ERROR; // skip next steps
    })
    .then(() => {
      // App state will affect whether or not we should be running auto picks
      // SET AND FORGET
      ensureNextAutoPick();

      return access.getAppState();
    })
    .then((appState) => {
      res.status(200).send({ appState });
      io.sockets.emit('change:appstate', {
        data: { appState }
      });
    })
    .catch((err) => {
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
  .then(() => {
    expressServer.listen(port);
    redisPubSubClient.subscribe("scores:update");

    // Give some time to settle, and then start ensuring we run auto picks
    setTimeout(ensureNextAutoPick, AUTO_PICK_STARTUP_DELAY);

    console.log('I am fully running now!');
  })
  .catch(function (err) {
    console.log(err);
    mongooseUtil.close();
  });
