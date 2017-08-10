'use strict';

var _ = require('lodash');
var config = require('./config');
var constants = require('../common/constants');
var models = require('./models');
var chatModels = require('./chatModels');
var Promise = require('promise');
var io = require('./socketIO');
var tourneyCfg = require('./tourneyConfigReader').loadConfig();

var UNKNOWN_WGR = constants.UNKNOWN_WGR;
var TOURNEY_ID = tourneyCfg.tourney_id || config.tourney_id;
var TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
var FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };

function setTourneyId(id) {
  TOURNEY_ID = id;
  TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
  FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };

}

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
    var mongoosePromise = fn.apply(null, arguments);
    var rVal = promiseize(mongoosePromise);
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
      var query = _.pick(o, queryMask);
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
    console.warn('WGR not found for: ' + golfer.name);
    golfer.wgr = UNKNOWN_WGR;
  } else {
    golfer.wgr = wgrEntry.wgr;
  }
  return golfer;
}

var access = {};
_.extend(access, {

  getTourney: promiseizeFn(function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  }),

  getGolfer: function (golferId) {
    var query = _.extend({ _id: golferId }, FK_TOURNEY_ID_QUERY);
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
    var query = _.extend({ _id: playerId }, FK_TOURNEY_ID_QUERY);
    return models.Player.findOne(query).exec();
  }),

  getGolfers: function () {
    return Promise.all([
      promiseize(models.WGR.find().exec()),
      promiseize(models.Golfer.find(FK_TOURNEY_ID_QUERY).exec()),
    ])

    .then(function (results) {
      var wgrs = _.indexBy(results[0], 'name');
      var golfers = _.map(results[1], function (g) {
        return mergeWGR(g, wgrs[g.name]);
      });

      return golfers;
    });
  },

  getPlayers: createBasicGetter(models.Player),

  getScores: createBasicGetter(models.GolferScore),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

  getAppState: function () {
    return promiseize(models.AppState.findOne(FK_TOURNEY_ID_QUERY).exec())
      .then(function (appState) {
        return appState || { isDraftPause: false, allowClock: true };
      });
  },

  updateAppState: promiseizeFn(function (props) {
    return models.AppState.update(
      FK_TOURNEY_ID_QUERY,
      props,
      {upsert: true}
    ).exec();
  }),

  makePick: function (pick, ignoreOrder) {
    var pickOrderQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
      pickNumber: pick.pickNumber,
      player: pick.player
    });
    var golferDraftedQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
      golfer: pick.golfer
    });
    var golferExistsQuery = _.extend({}, FK_TOURNEY_ID_QUERY, {
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
      var nPicks = result[0];
      var playerIsUp = !!result[1] || true;
      var golferAlreadyDrafted = result[2];
      var golferExists = !!result[3];

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
    });
  },

  undoLastPick: function () {
    return promiseize(models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec())
    .then(function (nPicks) {
      return promiseize(models.DraftPick.remove({ pickNumber: nPicks - 1 }).exec());
    });
  },

  getDraft: function () {
    return Promise.all([
      promiseize(models.DraftPickOrder.find(FK_TOURNEY_ID_QUERY).exec()),
      promiseize(models.DraftPick.find(FK_TOURNEY_ID_QUERY).exec()),
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

  clearChatMessages: createBasicClearer(chatModels.Message),

  resetTourney: function (newId) {
    if (newId)
      setTourneyId(newId);
    return Promise.all(_.map([
      models.Tourney.update(TOURNEY_ID_QUERY, {
        name: null,
        par: -1,
        sourceUrl: null
      }).exec(),

      access.clearPlayers(),
      access.clearPickOrder(),
      access.clearDraftPicks(),
      access.clearGolfers(),
      access.clearGolferScores(),
      access.clearGolferScoreOverrides(),
      access.clearChatMessages()
    ], promiseize));
  }

});

module.exports = access;
