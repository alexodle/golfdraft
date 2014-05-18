'use strict';

var Store = require('./Store');
var merge = require('react/lib/merge');
var _ = require('underscore');

var _players = {};

var PlayerStore = merge(Store.prototype, {

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
