const _ = require('lodash');

_.mixin({

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
    return _.some(oidList, _.partial(utils.oidsAreEqual, targetOid));
  }

};

module.exports = utils;
