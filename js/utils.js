var _ = require('lodash');

var utils = {

  transpose: function (a) {
    if (!a.length) {
      return a;
    }
    return Object.keys(a[0]).map(function (c) {
      return a.map(function (r) { return r[c]; });
    });
  },

  getOrdinal: function (n) {
    var s=["th","st","nd","rd"],
        v=n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
  }

};

module.exports = utils;
