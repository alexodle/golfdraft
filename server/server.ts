import {
  getAccess,
  getActiveTourneyAccess,
  getAllTourneys,
  getAppState,
  getUsers,
  updateAppState,
  Access
} from './access';
import {find} from 'lodash';
import * as bodyParser from 'body-parser';
import * as chatBot from './chatBot';
import * as compression from 'compression';
import * as connectRedis from 'connect-redis';
import * as exphbs  from 'express-handlebars';
import * as express from 'express';
import * as mongooseUtil from './mongooseUtil';
import * as passport from 'passport';
import * as session from 'express-session';
import * as userAccess from './userAccess';
import * as utils from '../common/utils';
import * as updateTourneyStandings from '../scores_sync/updateTourneyStandings';
import app from './expressApp';
import config from './config';
import expressServer from './expressServer';
import io from './socketIO';
import redis from './redis';
import {Request, Response, NextFunction} from 'express';
import {requireSession} from './authMiddleware';
import {User} from './models';
import {
  AppSettings,
  Draft,
  DraftPick,
  BootstrapPayload,
} from './ServerTypes';

const RedisStore = connectRedis(session);
const redisPubSubClient = redis.pubSubClient;

const port = Number(process.env.PORT || 3000);

const MAX_AGE = 1000 * 60 * 60 * 24 * 365;
const ENSURE_AUTO_PICK_DELAY_MILLIS = 500;
const AUTO_PICK_STARTUP_DELAY = 1000 * 5;

async function defineRoutes() {
  const activeTourneyId = (await getAppState()).activeTourneyId;
  const activeTourneyAccess = await getActiveTourneyAccess();

  // Temp temp - remove this when we have multiple nodes
  userAccess.refresh();

  // Gzip
  app.use(compression());

  // Handlebars
  app.engine('handlebars', exphbs({
    helpers: {
      or: (a, b) => a || b
    }
  }));
  app.set('view engine', 'handlebars');

  // Static routes
  if (config.devMode) {
    app.set('views', './distd/');
    app.use('/dist', express.static(__dirname + '/../../distd'));
  } else {
    app.set('views', './dist/');
    app.use('/dist', express.static(__dirname + '/../../dist', {
      maxAge: MAX_AGE
    }));
  }
  app.use('/assets', express.static(__dirname + '/../../assets', {
    maxAge: MAX_AGE
  }));

  // Session handling
  const sessionMiddleware = session({
    store: new RedisStore({ url: config.redis_url }),
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // TODO: Get this working when we have real logins
      maxAge: MAX_AGE
    }
  });
  app.use(sessionMiddleware);
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  // Authentication
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((<any>User).serializeUser());
  passport.deserializeUser((<any>User).deserializeUser());
  passport.use((<any>User).createStrategy());

  // Parsing
  app.use(bodyParser());

  // Global error handling
  app.use((err, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      next();
    }
  });

  // Ensure req is fully populated
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      userAccess.onUserActivity(req.session.id, req.user._id.toString());
    }
    req.access = req.access || activeTourneyAccess;
    next();
  });

  app.param('tourneyId', (req: Request, res: Response, next: NextFunction, tourneyId: string) => {
    try {
      req.access = getAccess(tourneyId);
    } catch (err) {
      return res.sendStatus(404); // Invalid tourneyId
    }
    next();
  });

  async function emitTourneyStandings() {
    const tourneyStandings = await activeTourneyAccess.getTourneyStandings();
    io.sockets.emit('change:scores', {
      data: {
        tourneyStandings,
        lastUpdated: new Date()
      },
      evType: 'change:scores',
      action: 'scores:periodic_update'
    });
  }

  redisPubSubClient.on("message", (channel, message) => {
    // Scores updated, alert clients
    console.log("redis message: channel " + channel + ": " + message);
    emitTourneyStandings();
  });

  activeTourneyAccess.on(Access.EVENTS.standingsUpdate, emitTourneyStandings);

  activeTourneyAccess.on(Access.EVENTS.pickMade, async () => {
    const isDraftOver = await activeTourneyAccess.isDraftComplete();
    if (isDraftOver) {
      updateTourneyStandings.run(activeTourneyAccess);
    }
  });

  // Include chat routes
  require('./chatRoutes');

  // Include socket server
  require('./socketServer');

  // Support legacy urls
  app.get(/\/tourney\/?/, (req: Request, res: Response, next: NextFunction) => {
    res.redirect('/');
  });

  app.get(['/', '/draft'], (req: Request, res: Response, next: NextFunction) => {
    res.redirect(`/${activeTourneyId}${req.path}`);
  });

  app.get(['/whoisyou', '/admin', '/history', '/:tourneyId/draft', '/:tourneyId'], async (req: Request, res: Response, next: NextFunction) => {
    const access = req.access;
    const tourneyId = access.getTourneyId();
    const [golfers, users, draft, tourneyStandings, appState, allTourneys] = await Promise.all([
      access.getGolfers(),
      getUsers(),
      access.getDraft(),
      access.getTourneyStandings(),
      getAppState(),
      getAllTourneys(),
    ]);
    const tourney = find(allTourneys, t => utils.oidsAreEqual(tourneyId, t._id));
    if (!tourney) {
      res.sendStatus(404);
      return;
    }
    res.render('index', {
      golfers: JSON.stringify(golfers),
      users: JSON.stringify(users),
      draft: JSON.stringify(draft),
      tourneyStandings: JSON.stringify(tourneyStandings),
      tourney: JSON.stringify(tourney),
      appState: JSON.stringify(appState),
      user: JSON.stringify(req.user),
      activeTourneyId: activeTourneyId,
      allTourneys: JSON.stringify(allTourneys),
      prod: !config.devMode,
      cdnUrl: config.cdn_url
    } as BootstrapPayload);
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

  app.get(['/draft/pickList', '/:tourneyId/draft/pickList'], requireSession(), async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const pickList = await req.access.getPickList(user._id);
    res.status(200).send({ userId: user._id, pickList: pickList });
  });

  app.post('/draft/pickList', requireSession(), async (req: Request, res: Response, next: NextFunction) => {
    const access = req.access;
    const body = req.body;
    const user = req.user;

    try {
      if (body.pickList) {
        await access.updatePickList(user._id, body.pickList);
        res.status(200).send({ userId: user._id, pickList: body.pickList });
      } else {
        const result = await access.updatePickListFromNames(user._id, body.pickListNames);
        if (result.completed) {
          res.status(200).send({ userId: user._id, pickList: result.pickList });
        } else {
          res.status(300).send({ userId: user._id, suggestions: result.suggestions });
        }
      }
    } catch (err) {
      next(err);
    }
  });

  app.put('/draft/autoPick', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const user = req.user;

    const autoPick = !!body.autoPick;
    onAppStateUpdate(req, res, req.access.updateAutoPick(user._id, autoPick));
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
      makePick: () => req.access.makePick(pick),
      broadcastPickMessage: (spec) => chatBot.broadcastPickMessage(user, spec.pick, spec.draft)
    });
  });

  app.post('/draft/pickPickListGolfer', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const currentUuser = req.user;

    const forUser = body.user;
    const pickNumber = body.pickNumber;

    let isPickListPick = false;
    return handlePick({
      res,
      makePick: async () => {
        const result = await req.access.makePickListPick(forUser, pickNumber);
        isPickListPick = result.isPickListPick;
        return result;
      },
      broadcastPickMessage: (spec) => {
        return chatBot.broadcastProxyPickListPickMessage(currentUuser, spec.pick, spec.draft, isPickListPick);
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
    return onAppStateUpdate(req, res, req.access.updateAutoPick(userId, autoPick));
  });

  app.put('/admin/pause', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can pause the draft');
      return;
    }

    const isDraftPaused = !!req.body.isPaused;
    return onAppStateUpdate(req, res, updateAppState({ isDraftPaused } as AppSettings));
  });

  app.put('/admin/allowClock', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle clock');
      return;
    }

    const allowClock = !!req.body.allowClock;
    return onAppStateUpdate(req, res, updateAppState({ allowClock } as AppSettings));
  });

  app.put('/admin/draftHasStarted', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can toggle draft status');
      return;
    }

    const draftHasStarted = !!req.body.draftHasStarted;
    return onAppStateUpdate(req, res, updateAppState({ draftHasStarted } as AppSettings));
  });

  app.delete('/admin/lastpick', requireSession(), (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      res.status(401).send('Only can admin can undo picks');
      return;
    }

    return handlePick({
      force: true,
      res,
      makePick: () => req.access.undoLastPick(),
      broadcastPickMessage: (spec) => chatBot.broadcastUndoPickMessage(spec.pick, spec.draft)
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

function updateClients(draft) {
  io.sockets.emit('change:draft', {
    data: draft,
    evType: 'change:draft',
    action: 'draft:pick'
  });
}

 // HELPERS

function isDraftOver(draft: Draft) {
  const nextPickNumber = draft.picks.length;
  const nextPick = draft.pickOrder[nextPickNumber];
  return !nextPick;
}

function ensureNextAutoPick() {
  setTimeout(async () => {
    try {
      console.info('ensureNextAutoPick: running');
      const spec = await isDraftRunning();
      if (!spec) {
        console.info('ensureNextAutoPick: draft is not running, skipping');
        return;
      }

      const {appState, draft} = spec;
      const {autoPickUsers} = appState;
      const nextPickNumber = draft.picks.length;
      const nextPick = draft.pickOrder[nextPickNumber];
      const nextPickUser = nextPick.user;

      if (utils.containsObjectId(autoPickUsers, nextPickUser)) {
        console.info('ensureNextAutoPick: making next pick!');
        autoPick(nextPickUser.toString(), nextPickNumber);
      } else {
        console.info(`ensureNextAutoPick: not auto-picking; user not in auto-pick list. ` +
          `user: ${nextPickUser}, autoPickUsers: ${autoPickUsers}`);
      }
    } catch (err) {
      console.log(err);
    }
  }, ENSURE_AUTO_PICK_DELAY_MILLIS);
}

function autoPick(userId: string, pickNumber: number) {
  console.info(`autoPick: Auto-picking for ${userId}, ${pickNumber}`);
  let isPickListPick = null;
  return handlePick({
    makePick: async () => {
      const activeTourneyAccess = await getActiveTourneyAccess();
      const result = await activeTourneyAccess.makePickListPick(userId, pickNumber);
      isPickListPick = result.isPickListPick;
      return result;
    },
    broadcastPickMessage: (spec) => chatBot.broadcastAutoPickMessage(spec.pick, spec.draft, isPickListPick)
  });
}

async function isDraftRunning(): Promise<{ appState: AppSettings, draft: Draft } | false> {
  const activeTourneyAccess = await getActiveTourneyAccess();
  const appState = await getAppState();
  const draft = await activeTourneyAccess.getDraft();
  if (isDraftOver(draft) || appState.isDraftPaused || !appState.draftHasStarted) {
    return false;
  }
  return { appState, draft };
}

async function handlePick(spec: {
  res?: Response,
  makePick: () => Promise<DraftPick>,
  broadcastPickMessage: ({ pick: DraftPick, draft: Draft }) => Promise<any>,
  force?: boolean
}) {
  const {res, makePick, broadcastPickMessage, force} = spec;

  let pick = null;
  let draft = null;
  try {
    if (!force) {
      const isRunning = await isDraftRunning();
      if (!isRunning) {
        if (res) {
          res.send(403).send({ message: 'Draft is not running' });
        }
        return;
      }
    }

    pick = await makePick();
    if (res) {
      res.status(200).send({ pick });
    }
  } catch (err) {
    if (res) {
      if (err.message.indexOf('invalid pick') !== -1) {
        res.status(400).send(err);
      } else {
        res.status(500).send(err);
      }
    }
    return;
  }

  const activeTourneyAccess = await getActiveTourneyAccess();
  draft = await activeTourneyAccess.getDraft();
  updateClients(draft);

  await broadcastPickMessage({ pick, draft });
  ensureNextAutoPick();
}

async function onAppStateUpdate(req: Request, res: Response, promise: Promise<any>) {
  await promise;

  // App state will affect whether or not we should be running auto picks
  // SET AND FORGET
  ensureNextAutoPick();

  const appState = await getAppState();
  res.status(200).send({ appState });
  io.sockets.emit('change:appstate', { data: { appState } });
}

async function run() {
  await mongooseUtil.connect();
  await defineRoutes();

  expressServer.listen(port);
  redisPubSubClient.subscribe("scores:update");

  // Give some time to settle, and then start ensuring we run auto picks
  setTimeout(ensureNextAutoPick, AUTO_PICK_STARTUP_DELAY);

  console.log('I am fully running now!');
}

run();
