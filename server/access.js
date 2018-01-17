'use strict';

const _ = require('lodash');
const chatModels = require('./chatModels');
const config = require('./config');
const constants = require('../common/constants');
const io = require('./socketIO');
const levenshteinDistance = require('./levenshteinDistance');
const models = require('./models');
const Promise = require('promise');

const UNKNOWN_WGR = constants.UNKNOWN_WGR;
const TOURNEY_ID = config.tourney_id;
const TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
const FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };
const PLACEHOLDER_PASSWORD = 'PLACEHOLDER_PASSWORD';

function extendWithTourneyId(obj) {
  return _.extend({}, obj, FK_TOURNEY_ID_QUERY);
}

function extendAllWithTourneyId(objs) {
  return _.map(objs, extendWithTourneyId);
}

function nameToUsername(name) {
  return name
    .toLowerCase()
    .replace(' ', '_');
}

function createBasicGetter(model) {
  return function () {
    return model.find(FK_TOURNEY_ID_QUERY).exec();
  };
}

function createMultiUpdater(model, queryMask) {
  return function (objs) {
    objs = extendAllWithTourneyId(objs);
    return Promise.all(_.map(objs, function (o) {
      const query = _.pick(o, queryMask);
      return model.update(query, o, {upsert: true}).exec();
    }));
  };
}

function createBasicClearer(model) {
  return function () {
    return model.remove(FK_TOURNEY_ID_QUERY).exec();
  };
}

function mergeWGR(golfer, wgrEntry) {
  golfer = _.pick(golfer, '_id', 'name');
  if (!wgrEntry) {
    //console.warn('WGR not found for: ' + golfer.name);
    golfer.wgr = UNKNOWN_WGR;
  } else {
    golfer.wgr = wgrEntry.wgr;
  }
  return golfer;
}

const access = {};
_.extend(access, {

  getTourney: function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  },

  getPickList: function (userId) {
    const query = _.extend({ userId: userId }, FK_TOURNEY_ID_QUERY);
    return models.DraftPickList.findOne(query).exec()
      .then(function (pickList) {
        return pickList ? pickList.golferPickList : null;
      });
  },

  updatePickList: function (userId, pickList) {
    pickList = _.uniq(pickList);
    const query = _.extend({ userId: userId }, FK_TOURNEY_ID_QUERY);
    return models.DraftPickList
      .update(
        query,
        { $set: { golferPickList: pickList } },
        { upsert: true }
      ).exec()
      .then(function () {
        return {
          completed: true,
          pickList: pickList
        };
      });
  },

  updateAutoPick: function (userId, autoPick) {
    const query = FK_TOURNEY_ID_QUERY;

    let update = null;
    if (!!autoPick) {
      update = models.AppState.update(
        query,
        { $addToSet: { autoPickUsers: userId } },
        { upsert: true });
    } else {
      update = models.AppState.update(
        query,
        { $pull: { autoPickUsers: userId } },
        { multi: true });
    }

    return update.exec();
  },

  updatePickListFromNames: function (userId, pickListNames) {
    return access.getGolfers()
    .then(function (golfers) {
      const golfersByLcName = _.indexBy(golfers, function (g) {
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
        return access.updatePickList(userId, pickList);
      }

      // Did not find at at least one golfer by name. Calculate closest matches and provide those
      // suggestions to the client.
      const suggestions = levenshteinDistance.runAll(notFoundGolferNames, _.pluck(golfers, 'name'));
      return {
        completed: false,
        suggestions: suggestions
      };
    });
  },

  getGolfer: function (golferId) {
    const query = _.extend({ _id: golferId }, FK_TOURNEY_ID_QUERY);
    return models.Golfer.findOne(query).exec()
      .then(function (golfer) {
        return models.WGR.findOne({ name: golfer.name }).exec()
          .then(function (wgr) {
            return mergeWGR(golfer, wgr);
          })
          .catch(function () {
            return mergeWGR(golfer);
          });
      });
  },

  getUser: function (userId) {
    return models.User.findOne({ _id: userId }).exec();
  },

  validateAndGetUser: function (username, password) {
    return models.User.findOne({ username }).select('+password').exec()
      .then(function (user) {
        if (user.validPassword(password)) {
          return access.getUser(user._id);
        }
        return null;
      })
      .catch(function (err) {
        console.log(err);
        return null;
      });
  },

  getUserByUsername: function (username, withPassword) {
    const findOp = models.User.findOne({ username });
    if (withPassword) {
      findOp = findOp.select('+password');
    }
    return findOp.exec();
  },

  getGolfers: function () {
    return Promise.all([
        models.WGR.find().exec(),
        models.Golfer.find(FK_TOURNEY_ID_QUERY).exec(),
      ])
      .then(function (results) {
        const wgrs = _.indexBy(results[0], 'name');
        const golfers = _.map(results[1], function (g) {
          return mergeWGR(g, wgrs[g.name]);
        });
        return golfers;
      });
  },

  getUsers: function () {
    return models.User.find({}).exec();
  },

  getScores: createBasicGetter(models.GolferScore),

  getPicks: createBasicGetter(models.DraftPick),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

  getAppState: function () {
    return models.AppState.findOne(FK_TOURNEY_ID_QUERY).exec()
      .then(function (appState) {
        return appState || { isDraftPause: false, allowClock: true, draftHasStarted: false };
      });
  },

  updateAppState: function (props) {
    return models.AppState.update(
      FK_TOURNEY_ID_QUERY,
      props,
      { upsert: true }
    ).exec();
  },

  makePickListPick: function (userId, pickNumber) {
    return Promise.all([
      access.getPickList(userId),
      access.getGolfers(),
      access.getPicks()
    ])
    .then(function (results) {
      const pickList = results[0] || [];
      const golfers = results[1];
      const picks = results[2];

      const pickedGolfers = _.chain(picks)
        .pluck('golfer')
        .indexBy()
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
        .pluck('_id')
        .invoke('toString')
        .filter(function (gid) {
          return !pickedGolfers[gid];
        })
        .first()
        .value();

      return access.makePick({
          pickNumber: pickNumber,
          user: userId,
          golfer: golferToPick
        })
        .then(function (resp) {
          return _.extend({ isPickListPick }, resp);
        });
    });
  },

  makePick: function (pick, ignoreOrder) {
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

        if (nPicks !== _.parseInt(pick.pickNumber) && !ignoreOrder) {
          throw new Error('invalid pick: pick order out of sync');
        } else if (!userIsUp && !ignoreOrder) {
          throw new Error('invalid pick: user picked out of order');
        } else if (golferAlreadyDrafted) {
          throw new Error('invalid pick: golfer already drafted');
        } else if (!golferExists) {
          throw new Error('invalid pick: invalid golfer');
        }

        pick = extendWithTourneyId(pick);
        pick.timestamp = new Date();
        return models.DraftPick.create(pick);
      })
      .then(function () {
        return pick;
      });
  },

  undoLastPick: function () {
    return models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec()
      .then(function (nPicks) {
        return models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec();
      });
  },

  getDraft: function () {
    return Promise.all([
        models.DraftPickOrder.find(FK_TOURNEY_ID_QUERY).exec(),
        access.getPicks()
      ])
      .then(function (results) {
        return {
          pickOrder: _.sortBy(results[0], 'pickNumber'),
          picks: _.sortBy(results[1], 'pickNumber'),
          serverTimestamp: new Date()
        };
      });
  },

  updateTourney: function (props) {
    props = _.extend({}, props, { lastUpdated: new Date() });
    console.log('updating tourney: ' + JSON.stringify(props));
    return models.Tourney.update(
      TOURNEY_ID_QUERY,
      props,
      {upsert: true}
    ).exec();
  },

  ensureUsers: function (allUsers) {
    const userJsons = _.map(allUsers, function (user) {
      const name = user.name;
      const username = nameToUsername(name);
      const password = PLACEHOLDER_PASSWORD;
      return { name, username, password };
    });
    return access.getUsers()
      .then(function (users) {
        const existingUsersByName = _.indexBy(users, 'name');
        const usersToAdd = _.filter(userJsons, function (json) {
          return !existingUsersByName[json.name];
        });
        return models.User.create(usersToAdd);
      });
  },

  ensureGolfers: createMultiUpdater(models.Golfer, ['name', 'tourneyId']),

  replaceWgrs: function (wgrEntries) {
    return models.WGR.remove().exec()
      .then(function () {
        return models.WGR.create(wgrEntries);
      });
  },

  setPickOrder: createMultiUpdater(
    models.DraftPickOrder,
    ['tourneyId', 'user', 'pickNumber']
  ),

  updateScores:  createMultiUpdater(
    models.GolferScore,
    ['golfer', 'tourneyId']
  ),

  // Chat

  getChatMessages: function () {
    return chatModels.Message.find(FK_TOURNEY_ID_QUERY).exec();
  },

  createChatMessage: function (message) {
    message = extendWithTourneyId(message);
    message.date = new Date(); // probably not needed b/c we can use ObjectId
    return chatModels.Message.create(message)
    .then(function () {
      io.sockets.emit('change:chat', {
        data: message,
        evType: 'change:chat',
        action: 'chat:newMessage'
      });
    });
  },

  createChatBotMessage: function (message) {
    return access.createChatMessage(_.extend({ isBot: true }, message));
  },

  // DEBUGGING/TESTING

  clearTourney: function () {
    return models.Tourney.remove(TOURNEY_ID_QUERY).exec();
  },

  clearPickOrder: createBasicClearer(models.DraftPickOrder),

  clearDraftPicks: createBasicClearer(models.DraftPick),

  clearGolfers: createBasicClearer(models.Golfer),

  clearGolferScores: createBasicClearer(models.GolferScore),

  clearGolferScoreOverrides: createBasicClearer(
    models.GolferScoreOverrides
  ),

  clearPickLists: createBasicClearer(models.DraftPickList),

  clearChatMessages: createBasicClearer(chatModels.Message),

  clearWgrs: createBasicClearer(models.WGR),

  clearAppState: createBasicClearer(models.AppState),

  clearUsers: function () {
    return models.User.remove({}).exec();
  },

  resetTourney: function () {
    return Promise.all([
      models.Tourney.update(TOURNEY_ID_QUERY, {
        name: null,
        par: -1
      }).exec(),
      access.clearPickOrder(),
      access.clearDraftPicks(),
      access.clearGolfers(),
      access.clearGolferScores(),
      access.clearGolferScoreOverrides(),
      access.clearChatMessages(),
      access.clearPickLists(),
      access.clearAppState()
    ]);
  }

});

module.exports = access;
