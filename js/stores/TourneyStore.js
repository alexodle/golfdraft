'use strict';

var _ = require('lodash');
var Store = require('./Store');

var TourneyStore =  _.extend({}, Store.prototype, {

  getTourneyName: function () {
    // HACKHACK - hardcode for now
    return "2015 TPC";
  }

});

module.exports = TourneyStore;
