'use strict';

var _ = require('lodash');
var config = require('./config');
var models = require('./models');
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

var access = {

  getTourney: promiseizeFn(function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  }),

  getGolfers: createBasicGetter(models.Golfer),

  getPlayers: createBasicGetter(models.Player),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

  makePick: function (pick) {
    return promiseize(models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec())
    .then(function (nPicks) {
      if (nPicks !== _.parseInt(pick.pickNumber)) {
        throw new Error('invalid pick');
      }

      pick = extendWithTourneyId(pick);
      return promiseize(models.DraftPick.create(pick));
    });
  },

  resetTourney: function () {
    return Promise.all(_.map([
      models.Tourney.update(TOURNEY_ID_QUERY, {
        name: null,
        par: -1,
        yahooUrl: null
      }).exec(),
      models.Golfer.remove(FK_TOURNEY_ID_QUERY).exec(),
      models.Player.remove(FK_TOURNEY_ID_QUERY).exec(),
      models.DraftPickOrder.remove(FK_TOURNEY_ID_QUERY).exec(),
      models.DraftPick.remove(FK_TOURNEY_ID_QUERY).exec(),
      models.GolferScore.remove(FK_TOURNEY_ID_QUERY).exec(),
      models.GolferScoreOverrides.remove(FK_TOURNEY_ID_QUERY).exec()
    ], promiseize));
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

  addPlayers: createMultiUpdater(models.Player, ['name', 'tourneyId']),

  setPickOrder: createMultiUpdater(
    models.DraftPickOrder,
    ['tourneyId', 'player', 'pickNumber']
  ),

  ensureGolfers: createMultiUpdater(models.Golfer, ['name', 'tourneyId']),

  updateScores:  createMultiUpdater(
    models.GolferScore,
    ['golfer', 'tourneyId']
  )

};

module.exports = access;
