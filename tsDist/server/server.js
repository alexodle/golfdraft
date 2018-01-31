"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const access = require("./access");
const bodyParser = require("body-parser");
const chatBot = require("./chatBot");
const compression = require("compression");
const connectRedis = require("connect-redis");
const exphbs = require("express-handlebars");
const express = require("express");
const expressServer_1 = require("./expressServer");
const mongooseUtil = require("./mongooseUtil");
const passport = require("passport");
const session = require("express-session");
const tourneyConfigReader = require("./tourneyConfigReader");
const userAccess = require("./userAccess");
const utils = require("../common/utils");
const expressApp_1 = require("./expressApp");
const config_1 = require("./config");
const socketIO_1 = require("./socketIO");
const redis_1 = require("./redis");
const authMiddleware_1 = require("./authMiddleware");
const models_1 = require("./models");
const RedisStore = connectRedis(session);
const redisPubSubClient = redis_1.default.pubSubClient;
const port = Number(process.env.PORT || 3000);
const MAX_AGE = 1000 * 60 * 60 * 24 * 365;
const ENSURE_AUTO_PICK_DELAY_MILLIS = 500;
const AUTO_PICK_STARTUP_DELAY = 1000 * 5;
const NOT_AN_ERROR = {};
// Temp temp - remove this when we have multiple nodes
userAccess.refresh();
// Session handling
const sessionMiddleware = session({
    store: new RedisStore({ url: config_1.default.redis_url }),
    secret: config_1.default.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !!config_1.default.prod,
        maxAge: MAX_AGE
    }
});
expressApp_1.default.use(sessionMiddleware);
socketIO_1.default.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});
// Authentication
expressApp_1.default.use(passport.initialize());
expressApp_1.default.use(passport.session());
passport.serializeUser(models_1.User.serializeUser());
passport.deserializeUser(models_1.User.deserializeUser());
passport.use(models_1.User.createStrategy());
// Gzip
expressApp_1.default.use(compression());
// Handlebars
expressApp_1.default.engine('handlebars', exphbs({
    helpers: {
        or: function (a, b) { return a || b; }
    }
}));
expressApp_1.default.set('view engine', 'handlebars');
// Static routes
if (!config_1.default.prod) {
    expressApp_1.default.set('views', './distd/views/');
    expressApp_1.default.use('/dist', express.static(__dirname + '/../distd'));
}
else {
    expressApp_1.default.set('views', './dist/views/');
    expressApp_1.default.use('/dist', express.static(__dirname + '/../dist', {
        maxAge: MAX_AGE
    }));
}
expressApp_1.default.use('/assets', express.static(__dirname + '/../assets', {
    maxAge: MAX_AGE
}));
// Parsing
expressApp_1.default.use(bodyParser());
// Global error handling
expressApp_1.default.use(function erroHandler(err, req, res, next) {
    if (err) {
        console.log(err);
        res.status(500).send(err);
    }
    else {
        next();
    }
});
// Log session state on every request
expressApp_1.default.use(function logSessionState(req, res, next) {
    try {
        const session = req.session;
        console.log('ip=%s user=%j isAdmin=%s', req.connection.remoteAddress, req.user && req.user.username, !!session.isAdmin);
    }
    catch (e) {
        console.error(e);
    }
    next();
});
expressApp_1.default.use(function updateUserActivity(req, res, next) {
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
            socketIO_1.default.sockets.emit('change:scores', {
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
    expressApp_1.default.get(/\/tourney\/?/, (req, res, next) => {
        res.redirect('/');
    });
    expressApp_1.default.get(['/', '/draft', '/admin', '/whoisyou'], (req, res, next) => {
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
                prod: config_1.default.prod,
                cdnUrl: config_1.default.cdn_url
            });
        });
    });
    expressApp_1.default.post('/register', (req, res, next) => {
        const { username, name, password } = req.body;
        models_1.User.register(new models_1.User({ username, name }), password, (err) => {
            if (err) {
                console.log('error while user register!', err);
                res.sendStatus(401);
                return;
            }
            res.status(200).send({ username });
        });
    });
    expressApp_1.default.post('/login', passport.authenticate('local'), (req, res, next) => {
        res.status(200).send({ username: req.body.username });
    });
    expressApp_1.default.post('/logout', (req, res, next) => {
        userAccess.onUserLogout(req.session.id);
        req.logout();
        res.status(200).send({ 'username': null });
    });
    expressApp_1.default.get('/draft/pickList', authMiddleware_1.requireSession(), (req, res, next) => {
        const user = req.user;
        return access.getPickList(user._id)
            .then(function (pickList) {
            res.status(200).send({
                userId: user._id,
                pickList: pickList
            });
        });
    });
    expressApp_1.default.post('/draft/pickList', authMiddleware_1.requireSession(), (req, res, next) => {
        const body = req.body;
        const user = req.user;
        let promise = null;
        if (body.pickList) {
            access.updatePickList(user._id, body.pickList)
                .then(function () {
                res.status(200).send({ userId: user._id, pickList: body.pickList });
            })
                .catch(next);
        }
        else {
            access.updatePickListFromNames(user._id, body.pickListNames)
                .then(function (result) {
                if (result.completed) {
                    res.status(200).send({ userId: user._id, pickList: result.pickList });
                }
                else {
                    res.status(300).send({ userId: user._id, suggestions: result.suggestions });
                }
            })
                .catch(next);
        }
    });
    expressApp_1.default.put('/draft/autoPick', authMiddleware_1.requireSession(), (req, res, next) => {
        const body = req.body;
        const user = req.user;
        const autoPick = !!body.autoPick;
        onAppStateUpdate(req, res, access.updateAutoPick(user._id, autoPick));
    });
    expressApp_1.default.post('/draft/picks', authMiddleware_1.requireSession(), (req, res, next) => {
        const body = req.body;
        const user = req.user;
        const pick = {
            pickNumber: body.pickNumber,
            user: body.user,
            golfer: body.golfer
        };
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
    expressApp_1.default.post('/draft/pickPickListGolfer', authMiddleware_1.requireSession(), (req, res, next) => {
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
    expressApp_1.default.post('/admin/login', authMiddleware_1.requireSession(), (req, res, next) => {
        if (req.body.password !== config_1.default.admin_password) {
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
    expressApp_1.default.put('/admin/autoPickUsers', authMiddleware_1.requireSession(), (req, res, next) => {
        if (!req.session.isAdmin) {
            res.status(401).send('Only can admin can pause the draft');
            return;
        }
        const userId = req.body.userId;
        const autoPick = !!req.body.autoPick;
        return onAppStateUpdate(req, res, access.updateAutoPick(userId, autoPick));
    });
    expressApp_1.default.put('/admin/pause', authMiddleware_1.requireSession(), (req, res, next) => {
        if (!req.session.isAdmin) {
            res.status(401).send('Only can admin can pause the draft');
            return;
        }
        const isDraftPaused = !!req.body.isPaused;
        return onAppStateUpdate(req, res, access.updateAppState({ isDraftPaused }));
    });
    expressApp_1.default.put('/admin/allowClock', authMiddleware_1.requireSession(), (req, res, next) => {
        if (!req.session.isAdmin) {
            res.status(401).send('Only can admin can toggle clock');
            return;
        }
        const allowClock = !!req.body.allowClock;
        return onAppStateUpdate(req, res, access.updateAppState({ allowClock }));
    });
    expressApp_1.default.put('/admin/draftHasStarted', authMiddleware_1.requireSession(), (req, res, next) => {
        if (!req.session.isAdmin) {
            res.status(401).send('Only can admin can toggle draft status');
            return;
        }
        const draftHasStarted = !!req.body.draftHasStarted;
        return onAppStateUpdate(req, res, access.updateAppState({ draftHasStarted }));
    });
    expressApp_1.default.delete('/admin/lastpick', authMiddleware_1.requireSession(), (req, res, next) => {
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
    expressApp_1.default.put('/admin/forceRefresh', authMiddleware_1.requireSession(), (req, res, next) => {
        if (!req.session.isAdmin) {
            res.status(401).send('Only can admin can force refreshes');
            return;
        }
        socketIO_1.default.sockets.emit('action:forcerefresh');
        res.status(200).send({ forceRefresh: true });
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
            const { appState, draft } = spec;
            const { autoPickUsers } = appState;
            const nextPickNumber = draft.picks.length;
            const nextPick = draft.pickOrder[nextPickNumber];
            const nextPickUser = nextPick.user;
            if (utils.containsObjectId(autoPickUsers, nextPickUser)) {
                console.info('ensureNextAutoPick: making next pick!');
                autoPick(nextPickUser.toString(), nextPickNumber);
            }
            else {
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
function ensureDraftIsRunning(req, res) {
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
function handlePick(spec) {
    const { res, makePick, broadcastPickMessage, force } = spec;
    const promise = (!force ? ensureDraftIsRunning() : Promise.resolve());
    return promise
        .then(makePick)
        .catch((err) => {
        if (err === NOT_AN_ERROR)
            throw err;
        if (res) {
            if (err.message.indexOf('invalid pick') !== -1) {
                res.status(400).send(err);
            }
            else {
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
        if (err === NOT_AN_ERROR)
            throw err;
        console.log(err);
    });
}
function onAppStateUpdate(req, res, promise) {
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
        socketIO_1.default.sockets.emit('change:appstate', {
            data: { appState }
        });
    })
        .catch((err) => {
        if (err === NOT_AN_ERROR)
            throw err;
        console.log(err);
    });
}
function updateClients(draft) {
    socketIO_1.default.sockets.emit('change:draft', {
        data: draft,
        evType: 'change:draft',
        action: 'draft:pick'
    });
}
mongooseUtil.connect()
    .then(defineRoutes)
    .then(() => {
    expressServer_1.default.listen(port);
    redisPubSubClient.subscribe("scores:update");
    // Give some time to settle, and then start ensuring we run auto picks
    setTimeout(ensureNextAutoPick, AUTO_PICK_STARTUP_DELAY);
    console.log('I am fully running now!');
})
    .catch(function (err) {
    console.log(err);
    mongooseUtil.close();
});
