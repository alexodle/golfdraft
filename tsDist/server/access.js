"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const chatModels = require("./chatModels");
const config_1 = require("./config");
const constants_1 = require("../common/constants");
const socketIO_1 = require("./socketIO");
const levenshteinDistance = require("./levenshteinDistance");
const models = require("./models");
const mongooseUtil_1 = require("./mongooseUtil");
const UNKNOWN_WGR = constants_1.default.UNKNOWN_WGR;
const TOURNEY_ID = new mongooseUtil_1.mongoose.Types.ObjectId(config_1.default.tourney_id);
const TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
const FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };
const PLACEHOLDER_PASSWORD = 'PLACEHOLDER_PASSWORD';
function extendWithTourneyId(obj) {
    return Object.assign({}, obj, FK_TOURNEY_ID_QUERY);
}
function extendAllWithTourneyId(objs) {
    return _.map(objs, extendWithTourneyId);
}
function nameToUsername(name) {
    return name
        .toLowerCase()
        .replace(' ', '_');
}
function multiUpdate(model, queryMask, objs) {
    objs = extendAllWithTourneyId(objs);
    return Promise.all(_.map(objs, (o) => {
        const query = _.pick(o, queryMask);
        return model.update(query, o, { upsert: true }).exec();
    }));
}
;
function getAll(model) {
    return model.find(FK_TOURNEY_ID_QUERY).exec();
}
;
function clearAll(model) {
    return model.remove(FK_TOURNEY_ID_QUERY).exec();
}
;
function mergeWGR(golfer, wgrEntry) {
    let wgr = null;
    if (!wgrEntry) {
        console.log('WGR not found for: ' + golfer.name);
        wgr = UNKNOWN_WGR;
    }
    else {
        wgr = wgrEntry.wgr;
    }
    return Object.assign({ wgr }, golfer.toObject());
}
function getTourney() {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
}
exports.getTourney = getTourney;
function getPickList(userId) {
    const query = _.extend({ userId }, FK_TOURNEY_ID_QUERY);
    return models.DraftPickList.findOne(query).exec()
        .then((pickList) => {
        return pickList ? _.map(pickList.golferPickList, (oid) => oid.toString()) : null;
    });
}
exports.getPickList = getPickList;
function updatePickList(userId, pickList) {
    pickList = _.uniq(pickList);
    const query = _.extend({ userId: userId }, FK_TOURNEY_ID_QUERY);
    return models.DraftPickList
        .update(query, { $set: { golferPickList: pickList } }, { upsert: true }).exec()
        .then(function () {
        return {
            completed: true,
            pickList: pickList,
            suggestions: null
        };
    });
}
exports.updatePickList = updatePickList;
function updateAutoPick(userId, autoPick) {
    const query = FK_TOURNEY_ID_QUERY;
    let update = null;
    if (!!autoPick) {
        update = models.AppState.update(query, { $addToSet: { autoPickUsers: userId } }, { upsert: true });
    }
    else {
        update = models.AppState.update(query, { $pull: { autoPickUsers: userId } }, { multi: true });
    }
    return update.exec();
}
exports.updateAutoPick = updateAutoPick;
function updatePickListFromNames(userId, pickListNames) {
    return getGolfers()
        .then((golfers) => {
        const golfersByLcName = _.keyBy(golfers, function (g) {
            return g.name.toLowerCase();
        });
        const notFoundGolferNames = [];
        const pickList = _.map(pickListNames, function (n) {
            const g = golfersByLcName[n.toLowerCase()];
            if (!g) {
                notFoundGolferNames.push(n);
                return null;
            }
            return g._id.toString();
        });
        if (_.isEmpty(notFoundGolferNames)) {
            // SUCCESS! Found all golfers by name, so go ahead and save them.
            return updatePickList(userId, pickList);
        }
        // Did not find at at least one golfer by name. Calculate closest matches and provide those
        // suggestions to the client.
        const suggestions = levenshteinDistance.runAll(notFoundGolferNames, _.map(golfers, 'name'));
        return {
            completed: false,
            suggestions: suggestions,
            pickList: null
        };
    });
}
exports.updatePickListFromNames = updatePickListFromNames;
function getGolfer(golferId) {
    const query = _.extend({ _id: golferId }, FK_TOURNEY_ID_QUERY);
    return models.Golfer.findOne(query).exec()
        .then((golfer) => {
        return models.WGR.findOne({ name: golfer.name }).exec()
            .then((wgr) => {
            return mergeWGR(golfer, wgr);
        });
    });
}
exports.getGolfer = getGolfer;
function getUser(userId) {
    return models.User.findOne({ _id: userId }).exec();
}
exports.getUser = getUser;
function getGolfers() {
    return Promise.all([
        models.WGR.find().exec(),
        models.Golfer.find(FK_TOURNEY_ID_QUERY).exec(),
    ])
        .then(([_wgrs, _golfers]) => {
        const wgrs = _.keyBy(_wgrs, 'name');
        return _.map(_golfers, (g) => mergeWGR(g, wgrs[g.name]));
    });
}
exports.getGolfers = getGolfers;
function getUsers() {
    return models.User.find({}).exec();
}
exports.getUsers = getUsers;
function getScores() {
    return getAll(models.GolferScore);
}
exports.getScores = getScores;
function getPicks() {
    return getAll(models.DraftPick);
}
exports.getPicks = getPicks;
function getScoreOverrides() {
    return getAll(models.GolferScoreOverrides);
}
exports.getScoreOverrides = getScoreOverrides;
function getAppState() {
    return models.AppState.findOne(FK_TOURNEY_ID_QUERY).exec()
        .then((appState) => {
        return appState || Object.assign({}, FK_TOURNEY_ID_QUERY, { isDraftPaused: false, allowClock: true, draftHasStarted: false, autoPickUsers: [] });
    });
}
exports.getAppState = getAppState;
function updateAppState(props) {
    return models.AppState.update(FK_TOURNEY_ID_QUERY, props, { upsert: true }).exec();
}
exports.updateAppState = updateAppState;
function makePickListPick(userId, pickNumber) {
    return Promise.all([
        getPickList(userId),
        getGolfers(),
        getPicks()
    ])
        .then(function (results) {
        const pickList = results[0] || [];
        const golfers = results[1];
        const picks = results[2];
        const pickedGolfers = _.chain(picks)
            .map('golfer')
            .keyBy()
            .value();
        let golferToPick = _.chain(pickList)
            .invoke('toString')
            .filter(function (gid) {
            return !pickedGolfers[gid];
        })
            .first()
            .value();
        // If no golfer from the pickList list is available, use wgr
        let isPickListPick = !!golferToPick;
        golferToPick = golferToPick || _.chain(golfers)
            .sortBy(['wgr', 'name'])
            .map('_id')
            .invoke('toString')
            .filter(function (gid) {
            return !pickedGolfers[gid];
        })
            .first()
            .value();
        return makePick({
            pickNumber: pickNumber,
            user: new mongooseUtil_1.mongoose.Types.ObjectId(userId),
            golfer: golferToPick,
            timestamp: null,
            tourneyId: null,
        })
            .then(function (resp) {
            return _.extend({ isPickListPick }, resp);
        });
    });
}
exports.makePickListPick = makePickListPick;
function makePick(pick, ignoreOrder) {
    const pickOrderQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
        pickNumber: pick.pickNumber,
        user: pick.user
    });
    const golferDraftedQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
        golfer: pick.golfer
    });
    const golferExistsQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
        _id: pick.golfer
    });
    return Promise.all([
        // Ensure correct pick numnber
        models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec(),
        // Ensure this user is actually up in the draft
        models.DraftPickOrder.findOne(pickOrderQuery).exec(),
        // Ensure golfer isn't already picked
        models.DraftPick.findOne(golferDraftedQuery).exec(),
        // Ensure this golfer actually exists
        models.Golfer.findOne(golferExistsQuery).exec()
    ])
        .then(function (result) {
        const nPicks = result[0];
        const userIsUp = !!result[1];
        const golferAlreadyDrafted = result[2];
        const golferExists = !!result[3];
        if (nPicks !== pick.pickNumber && !ignoreOrder) {
            throw new Error('invalid pick: pick order out of sync');
        }
        else if (!userIsUp && !ignoreOrder) {
            throw new Error('invalid pick: user picked out of order');
        }
        else if (golferAlreadyDrafted) {
            throw new Error('invalid pick: golfer already drafted');
        }
        else if (!golferExists) {
            throw new Error('invalid pick: invalid golfer');
        }
        pick = extendWithTourneyId(pick);
        pick.timestamp = new Date();
        return models.DraftPick.create(pick);
    })
        .then(() => pick);
}
exports.makePick = makePick;
function undoLastPick() {
    return models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec()
        .then((nPicks) => {
        return models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec();
    });
}
exports.undoLastPick = undoLastPick;
function getDraft() {
    return Promise.all([
        models.DraftPickOrder.find(FK_TOURNEY_ID_QUERY).exec(),
        getPicks()
    ])
        .then(([pickOrder, picks]) => {
        return {
            pickOrder: _.sortBy(pickOrder, 'pickNumber'),
            picks: _.sortBy(picks, 'pickNumber'),
            serverTimestamp: new Date()
        };
    });
}
exports.getDraft = getDraft;
function updateTourney(props) {
    props = _.extend({}, props, { lastUpdated: new Date() });
    return models.Tourney.update(TOURNEY_ID_QUERY, props, { upsert: true }).exec();
}
exports.updateTourney = updateTourney;
function ensureUsers(allUsers) {
    const userJsons = _.map(allUsers, function (user) {
        const name = user.name;
        const username = nameToUsername(name);
        const password = PLACEHOLDER_PASSWORD;
        return { name, username, password };
    });
    return getUsers()
        .then(function (users) {
        const existingUsersByName = _.keyBy(users, 'name');
        const usersToAdd = _.filter(userJsons, function (json) {
            return !existingUsersByName[json.name];
        });
        return models.User.create(usersToAdd);
    });
}
exports.ensureUsers = ensureUsers;
function ensureGolfers(objs) {
    return multiUpdate(models.Golfer, ['name', 'tourneyId'], objs);
}
exports.ensureGolfers = ensureGolfers;
function replaceWgrs(wgrEntries) {
    return models.WGR.remove({}).exec()
        .then(() => {
        return models.WGR.create(wgrEntries);
    });
}
exports.replaceWgrs = replaceWgrs;
function setPickOrder(objs) {
    return multiUpdate(models.DraftPickOrder, ['tourneyId', 'user', 'pickNumber'], objs);
}
exports.setPickOrder = setPickOrder;
function updateScores(objs) {
    return multiUpdate(models.GolferScore, ['golfer', 'tourneyId'], objs);
}
exports.updateScores = updateScores;
// Chat
function getChatMessages() {
    return chatModels.Message.find(FK_TOURNEY_ID_QUERY).exec();
}
exports.getChatMessages = getChatMessages;
function createChatMessage(message) {
    message = extendWithTourneyId(message);
    message.date = new Date(); // probably not needed b/c we can use ObjectId
    return chatModels.Message.create(message)
        .then(() => {
        socketIO_1.default.sockets.emit('change:chat', {
            data: message,
            evType: 'change:chat',
            action: 'chat:newMessage'
        });
    });
}
exports.createChatMessage = createChatMessage;
function createChatBotMessage(message) {
    return createChatMessage(Object.assign({}, message, { isBot: true }));
}
exports.createChatBotMessage = createChatBotMessage;
// DEBUGGING/TESTING
function clearTourney() {
    return models.Tourney.remove(TOURNEY_ID_QUERY).exec();
}
exports.clearTourney = clearTourney;
function clearPickOrder() {
    return clearAll(models.DraftPickOrder);
}
exports.clearPickOrder = clearPickOrder;
function clearDraftPicks() {
    return clearAll(models.DraftPick);
}
exports.clearDraftPicks = clearDraftPicks;
function clearGolfers() {
    return clearAll(models.Golfer);
}
exports.clearGolfers = clearGolfers;
function clearGolferScores() {
    return clearAll(models.GolferScore);
}
exports.clearGolferScores = clearGolferScores;
function clearGolferScoreOverrides() {
    return clearAll(models.GolferScoreOverrides);
}
exports.clearGolferScoreOverrides = clearGolferScoreOverrides;
function clearPickLists() {
    return clearAll(models.DraftPickList);
}
exports.clearPickLists = clearPickLists;
function clearChatMessages() {
    return clearAll(chatModels.Message);
}
exports.clearChatMessages = clearChatMessages;
function clearWgrs() {
    return clearAll(models.WGR);
}
exports.clearWgrs = clearWgrs;
function clearAppState() {
    return clearAll(models.AppState);
}
exports.clearAppState = clearAppState;
function clearUsers() {
    return models.User.remove({}).exec();
}
exports.clearUsers = clearUsers;
function resetTourney() {
    return Promise.all([
        models.Tourney.update(TOURNEY_ID_QUERY, {
            name: null,
            par: -1
        }).exec(),
        clearPickOrder(),
        clearDraftPicks(),
        clearGolfers(),
        clearGolferScores(),
        clearGolferScoreOverrides(),
        clearChatMessages(),
        clearPickLists(),
        clearAppState()
    ]);
}
exports.resetTourney = resetTourney;
