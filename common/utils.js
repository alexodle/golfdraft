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

};

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// TODO: arrays?
function mergeDeep(target, source) {
  var output = _.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(function(key) {
      if (isObject(source[key])) {
        if (!(key in target))
          output[key] = source[key];
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

_.extend(utils, {
  isObject: isObject,
  mergeDeep: mergeDeep
});

module.exports = utils;
