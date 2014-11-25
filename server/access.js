'use strict';

var _ = require('lodash');
var config = require('./config');
var models = require('./models');
var Promise = require('promise');

var TOURNEY_ID = config.tourney_id;
var TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
var FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };

function extendWithTourneyId(objs) {
  return _.map(objs, function (o) {
    return _.extend({}, o, FK_TOURNEY_ID_QUERY);
  });
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

var access = {

  getTourney: promiseizeFn(function () {
    return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
  }),

  getGolfers: createBasicGetter(models.Golfer),

  getPlayers: createBasicGetter(models.Player),

  getScoreOverrides: createBasicGetter(models.GolferScoreOverrides),

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

  addPlayers: promiseizeFn(function (players) {
    players = extendWithTourneyId(players);
    return Promise.all(_.map(players, function (p) {
      var query = _.pick(p, 'name', 'tourneyId');
      return promiseize(
        models.Player.update(query, p, { upsert: true }).exec()
      );
    }));
  }),

  setPickOrder: function (pickOrder) {
    pickOrder = extendWithTourneyId(pickOrder);
    return models.DraftPickOrder.remove(FK_TOURNEY_ID_QUERY).exec()
    .then(function () {
      return Promise.all(_.map(pickOrder, function (dpo) {
        var query = _.pick(dpo, 'tourneyId', 'player', 'pickNumber');
        return promiseize(
          models.DraftPickOrder.update(
            query,
            dpo,
            { upsert: true }
          ).exec()
        );
      }));
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

  ensureGolfers: function (golfers) {
    golfers = extendWithTourneyId(golfers);
    return Promise.all(_.map(golfers, function (g) {
      var query = _.pick(g, 'name', 'tourneyId');
      return promiseize(
        models.Golfer.update(query, g, {upsert: true}).exec()
      );
    }));
  },

  updateScores: function (golferScores) {
    golferScores = extendWithTourneyId(golferScores);
    return Promise.all(_.map(golferScores, function (gs) {
      var query = _.pick(gs, 'golfer', 'tourneyId');
      return promiseize(
        models.GolferScore.update(query, gs, {upsert: true}).exec()
      );
    }));
  }

};

module.exports = access;
