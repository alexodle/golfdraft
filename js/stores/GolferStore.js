'use strict';

var Store = require('./Store');
var merge = require('react/lib/merge');
var _ = require('underscore');

var _golfers = {};

var GolferStore = merge(Store.prototype, {

  changeEvent: 'GolferStore:change',

  getAll: function () {
    return _.clone(_golfers);
  },

  getGolfer: function (id) {
    return _golfers[id];
  }

});

// HACKHACK
_golfers = _.indexBy(window.golfDraftSeed.golfers, 'id');

module.exports = GolferStore;
