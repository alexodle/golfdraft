const _ = require('lodash');

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

const utils = {

  getOrdinal: function (n) {
    const s=["th","st","nd","rd"],
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
  },

  toThruStr: function (thru) {
    if (thru === null) {
      return 'NS';
    } else if (thru === 18) {
      return 'F';
    } else {
      return 'thru ' + thru;
    }
  },

  oidsAreEqual: function (a, b) {
    // We may have ObjectId OR String values, so ensure to convert both toString before comparing
    return a.toString() === b.toString();
  },

  containsObjectId: function (oidList, targetOid) {
    return _.any(oidList, _.partial(utils.oidsAreEqual, targetOid));
  }

};

module.exports = utils;
