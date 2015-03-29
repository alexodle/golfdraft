var _ = require('lodash');

_.mixin({

  sum: function (arr, it, context) {
    it = _.createCallback(it);
    return _.reduce(arr, function (memo, value, index, list) {
      return memo + it.call(context, value, index, list);
    }, 0, context);
  },

  lock: function (fn) {
    return function () {
      return fn();
    };
  }

});

var utils = {

  getOrdinal: function (n) {
    var s=["th","st","nd","rd"],
        v=n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
  },

  toGolferScoreStr: function (n) {
    if (n === 0) {
      return 'E';
    } else if (n > 0) {
      return '+' + n;
    } else {
      return '' + n;
    }
  }

};

module.exports = utils;
