'use strict';

var Store = require('./Store');
var _ = require('lodash');

var _golfers = {};

var GolferStore =  _.extend({}, Store.prototype, {

  changeEvent: 'GolferStore:change',

  getAll: function () {
    return _golfers;
  },

  getGolfer: function (id) {
    return _golfers[id];
  }

});

// HACKHACK
_golfers = _.indexBy(window.golfDraftSeed.golfers, 'id');

module.exports = GolferStore;
