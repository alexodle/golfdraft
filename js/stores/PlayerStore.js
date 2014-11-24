'use strict';

var Store = require('./Store');
var _ = require('lodash');

var _players = {};

var PlayerStore =  _.extend({}, Store.prototype, {

  changeEvent: 'PlayerStore:change',

  getPlayer: function (id) {
    return _players[id];
  },

  getAll: function () {
    return _.clone(_players);
  }

});

// HACKHACK
_players = _.indexBy(window.golfDraftSeed.players, 'id');

module.exports = PlayerStore;
