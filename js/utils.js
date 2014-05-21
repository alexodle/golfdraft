var _ = require('underscore');

var utils = {

  transpose: function (a) {
    if (!a.length) {
      return a;
    }
    return Object.keys(a[0]).map(function (c) {
      return a.map(function (r) { return r[c]; });
    });
  }

};

module.exports = utils;
