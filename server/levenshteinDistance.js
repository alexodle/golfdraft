"use strict";

var _ = require("lodash");

var memo = {};

function _memoKey(i1, i2) {
  return i1 < i2 ?
    (i1 + "::" + i2) :
    (i2 + "::" + i1);
}

function _normalize(s) {
  return s.trim().toLowerCase();
}

function _calc(s1, s2, i1, i2) {
  var key = _memoKey(i1, i2);
  if (memo[key]) return memo[key];

  while (i1 < s1.length && i2 < s2.length && s1[i1] == s2[i2]) {
    i1 += 1;
    i2 += 1;
  }

  if (i1 == s1.length && i2 == s2.length) return 0;

  if (i1 == s1.length || i2 == s2.length) {
    return s1.length - i1 + s2.length - i2;
  }

  var dist1 = _calc(s1, s2, i1 + 1, i2);
  var dist2 = _calc(s1, s2, i1, i2 + 1);
  var dist = 1 + Math.min(dist1, dist2);

  memo[key] = dist;
  return dist;
}

function _forEachWordPermutation(words, callback, output) {
  if (_.isEmpty(words)) {
    return callback(output.join(" "));
  }

  _.each(words, function (w, i) {
    var newWords = words.slice(0, i).concat(words.slice(i + 1, words.length));
    return _forEachWordPermutation(newWords, callback, output.concat([w]));
  }); 
}

function runAll(sourceList, targetList) {
  return _.map(sourceList, function (sourceStr) {
    var results = _.chain(targetList)
      .map(function (targetStr) {
        return _.extend({ target: targetStr }, run(sourceStr, targetStr));
      })
      .sortBy(function (result) {
        return -result.coeff;
      })
      .value();
    return { source: sourceStr, results: results };
  });
}

function run(s1, s2) {
  var norms1 = _normalize(s1);
  var norms2 = _normalize(s2);

  var bestDist = Number.MAX_VALUE;
  _forEachWordPermutation(norms1.split(" "), function (s1perm) {
    memo = {};
    var dist = _calc(s1perm, norms2, 0, 0);

    bestDist = Math.min(bestDist, dist);
    return bestDist > 0;
  }, []);

  memo = {};
  return {
    dist: bestDist,
    coeff: (norms1.length + norms2.length - bestDist) / (norms1.length + norms2.length)
  };
}


module.exports = {
  run: run,
  runAll: runAll
}
