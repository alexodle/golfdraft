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

function extendWithTourneyId(obj) {
  return _.extend({}, obj, FK_TOURNEY_ID_QUERY);
}

function extendAllWithTourneyId(objs) {
  return _.map(objs, extendWithTourneyId);
}

function promiseize(mongoosePromise) {
  return new Promise(function (fulfill, reject) {
    return mongoosePromise.then(function () {
      fulfill.apply(null, arguments);
    }, function () {
      reject.apply(null, arguments);
    });
  });
}

function promiseizeFn(fn) {
  return function () {
    const mongoosePromise = fn.apply(null, arguments);
    const rVal = promiseize(mongoosePromise);
    return rVal;
  };
}

function createBasicGetter(model) {
  return promiseizeFn(function () {
    return model.find(FK_TOURNEY_ID_QUERY).exec();
  });
}

function createMultiUpdater(model, queryMask) {
  return function (objs) {
    objs = extendAllWithTourneyId(objs);
    return Promise.all(_.map(objs, function (o) {
      const query = _.pick(o, queryMask);
      return promiseize(model.update(query, o, {upsert: true}).exec());
    }));
  };
}

function createBasicClearer(model) {
  return promiseizeFn(function () {
    return model.remove(FK_TOURNEY_ID_QUERY).exec();
  });
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

  getTourney: promiseizeFn(function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  }),

  getPickList: function (playerId) {
    const query = _.extend({ userId: playerId }, FK_TOURNEY_ID_QUERY);
    return promiseize(models.DraftPickList.findOne(query).exec())
      .then(function (pickList) {
        return pickList ? pickList.golferPickList : null;
      });
  },

  /**
   * Return all players who have pick lists set
   */
  getPickListPlayers: promiseizeFn(function () {
    const query = _.extend({ 'golferPickList.1': { $exists: true } }, FK_TOURNEY_ID_QUERY);
    return promiseize(
      models.DraftPickList
        .find(query)
        .select({ userId: 1 })
        .exec())
      .then(function (pickLists) {
        return _.pluck(pickLists, 'userId');
      });
  }),

  updatePickList: function (playerId, pickList) {
    pickList = _.uniq(pickList);
    const query = _.extend({ userId: playerId }, FK_TOURNEY_ID_QUERY);
    return promiseize(models.DraftPickList
      .update(
        query,
        { $set: { golferPickList: pickList } },
        { upsert: true }
      ).exec())
      .then(function () {
        return {
          completed: true,
          pickList: pickList
        };
      });
  },

  updateAutoPick: promiseizeFn(function (playerId, autoPick) {
    const query = FK_TOURNEY_ID_QUERY;

    let update = null;
    if (!!autoPick) {
      update = models.AppState.update(
        query,
        { $addToSet: { autoPickPlayers: playerId } },
        { upsert: true });
    } else {
      update = models.AppState.update(
        query,
        { $pull: { autoPickPlayers: playerId } },
        { multi: true });
    }

    return update.exec();
  }),

  updatePickListFromNames: function (playerId, pickListNames) {
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
        return access.updatePickList(playerId, pickList);
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
    return promiseize(models.Golfer.findOne(query).exec())
    .then(function (golfer) {
      return promiseize(models.WGR.findOne({ name: golfer.name }).exec())
      .then(function (wgr) {
        golfer = mergeWGR(golfer, wgr);
      })
      .catch(function () {
        golfer = mergeWGR(golfer);
      })
      .then(function () {
        return golfer;
      });
    });
  },

  getPlayer: promiseizeFn(function (playerId) {
    const query = _.extend({ _id: playerId }, FK_TOURNEY_ID_QUERY);
    return models.Player.findOne(query).exec();
  }),

  getGolfers: function () {
    return Promise.all([
      promiseize(models.WGR.find().exec()),
      promiseize(models.Golfer.find(FK_TOURNEY_ID_QUERY).exec()),
    ])

    .then(function (results) {
      const wgrs = _.indexBy(results[0], 'name');
      const golfers = _.map(results[1], function (g) {
        return mergeWGR(g, wgrs[g.name]);
      });

      return golfers;
    });
  },

  getPlayers: createBasicGetter(models.Player),

  getScores: createBasicGetter(models.GolferScore),

  getPicks: createBasicGetter(models.DraftPick),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

  getAppState: function () {
    return promiseize(models.AppState.findOne(FK_TOURNEY_ID_QUERY).exec())
      .then(function (appState) {
        return appState || { isDraftPause: false, allowClock: true, draftHasStarted: false };
      });
  },

  updateAppState: promiseizeFn(function (props) {
    return models.AppState.update(
      FK_TOURNEY_ID_QUERY,
      props,
      { upsert: true }
    ).exec();
  }),

  makePickListPick: function (playerId, pickNumber) {
    return Promise.all([
      access.getPickList(playerId),
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
          player: playerId,
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
      player: pick.player
    });
    const golferDraftedQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
      golfer: pick.golfer
    });
    const golferExistsQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
      _id: pick.golfer
    });
    return Promise.all([
      // Ensure correct pick numnber
      promiseize(models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec()),

      // Ensure this player is actually up in the draft
      promiseize(models.DraftPickOrder.findOne(pickOrderQuery).exec()),

      // Ensure golfer isn't already picked
      promiseize(models.DraftPick.findOne(golferDraftedQuery).exec()),

      // Ensure this golfer actually exists
      promiseize(models.Golfer.findOne(golferExistsQuery).exec())
    ])
    .then(function (result) {
      const nPicks = result[0];
      const playerIsUp = !!result[1];
      const golferAlreadyDrafted = result[2];
      const golferExists = !!result[3];

      if (nPicks !== _.parseInt(pick.pickNumber) && !ignoreOrder) {
        throw new Error('invalid pick: pick order out of sync');
      } else if (!playerIsUp && !ignoreOrder) {
        throw new Error('invalid pick: player picked out of order');
      } else if (golferAlreadyDrafted) {
        throw new Error('invalid pick: golfer already drafted');
      } else if (!golferExists) {
        throw new Error('invalid pick: invalid golfer');
      }

      pick = extendWithTourneyId(pick);
      pick.timestamp = new Date();
      return promiseize(models.DraftPick.create(pick));
    })
    .then(function () {
      return pick;
    });
  },

  undoLastPick: function () {
    return promiseize(models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec())
    .then(function (nPicks) {
      return promiseize(models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec());
    });
  },

  getDraft: function () {
    return Promise.all([
      promiseize(models.DraftPickOrder.find(FK_TOURNEY_ID_QUERY).exec()),
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

  updateTourney: promiseizeFn(function (props) {
    props = _.extend({}, props, { lastUpdated: new Date() });
    console.log('updating tourney: ' + JSON.stringify(props));
    return models.Tourney.update(
      TOURNEY_ID_QUERY,
      props,
      {upsert: true}
    ).exec();
  }),

  ensurePlayers: createMultiUpdater(models.Player, ['name', 'tourneyId']),

  ensureGolfers: createMultiUpdater(models.Golfer, ['name', 'tourneyId']),

  replaceWgrs: function (wgrEntries) {
    return promiseize(models.WGR.remove().exec()).then(function () {
      return promiseize(models.WGR.create(wgrEntries));
    });
  },

  setPickOrder: createMultiUpdater(
    models.DraftPickOrder,
    ['tourneyId', 'player', 'pickNumber']
  ),


  updateScores:  createMultiUpdater(
    models.GolferScore,
    ['golfer', 'tourneyId']
  ),

  // Chat

  getChatMessages: promiseizeFn(function () {
    return chatModels.Message.find(FK_TOURNEY_ID_QUERY).exec();
  }),

  createChatMessage: promiseizeFn(function (message) {
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
  }),

  createChatBotMessage: function (message) {
    return access.createChatMessage(_.extend({ isBot: true }, message));
  },

  // DEBUGGING/TESTING

  clearTourney: promiseizeFn(function () {
    return models.Tourney.remove(TOURNEY_ID_QUERY).exec();
  }),

  clearPlayers: createBasicClearer(models.Player),

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

  resetTourney: function (clearPlayers) {
    const resets = [
      models.Tourney.update(TOURNEY_ID_QUERY, {
        name: null,
        par: -1,
        sourceUrl: null
      }).exec(),
      access.clearPickOrder(),
      access.clearDraftPicks(),
      access.clearGolfers(),
      access.clearGolferScores(),
      access.clearGolferScoreOverrides(),
      access.clearChatMessages(),
      access.clearPickLists(),
      access.clearAppState()
    ];

    if (clearPlayers) {
      resets.push(access.clearPlayers());
    }

    return Promise.all(_.map(resets, promiseize));
  }

});

module.exports = access;
