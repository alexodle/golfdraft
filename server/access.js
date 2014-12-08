'use strict';

var _ = require('lodash');
var config = require('./config');
var models = require('./models');
var chatModels = require('./chatModels');
var Promise = require('promise');

var TOURNEY_ID = config.tourney_id;
var TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
var FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };

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
    return promiseize(mongoosePromise);
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

var access = {};
_.extend(access, {

  getTourney: promiseizeFn(function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  }),

  getGolfers: createBasicGetter(models.Golfer),

  getPlayers: createBasicGetter(models.Player),

  getScores: createBasicGetter(models.GolferScore),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

  makePick: function (pick) {
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
      var playerIsUp = !!result[1];
      var golferAlreadyDrafted = result[2];
      var golferExists = !!result[3];

      if (nPicks !== _.parseInt(pick.pickNumber)) {
        throw new Error('invalid pick: pick order out of sync');
      } else if (!playerIsUp) {
        throw new Error('invalid pick: player picked out of order');
      } else if (golferAlreadyDrafted) {
        throw new Error('invalid pick: golfer already drafted');
      } else if (!golferExists) {
        throw new Error('invalid pick: invalid golfer');
      }

      pick = extendWithTourneyId(pick);
      return promiseize(models.DraftPick.create(pick));
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
        picks: _.sortBy(results[1], 'pickNumber')
      };
    });
  },

  updateTourney: promiseizeFn(function (props) {
    props = _.extend({}, props, { lastUpdated: new Date() });
    return models.Tourney.update(
      TOURNEY_ID_QUERY,
      props,
      {upsert: true}
    ).exec();
  }),

  ensurePlayers: createMultiUpdater(models.Player, ['name', 'tourneyId']),

  ensureGolfers: createMultiUpdater(models.Golfer, ['name', 'tourneyId']),

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
    return chatModels.Message.create(message);
  }),

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

  resetTourney: function () {
    return Promise.all(_.map([
      models.Tourney.update(TOURNEY_ID_QUERY, {
        name: null,
        par: -1,
        yahooUrl: null
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
