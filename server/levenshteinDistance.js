// @flow
'use strict';

const _ = require("lodash");
const _string = require("underscore.string");

function _normalize(s) {
  return s.trim().toLowerCase();
}

function _forEachWordPermutation(words, callback, output) {
  if (_.isEmpty(words)) {
    return callback(output.join(" "));
  }

  _.each(words, function (w, i) {
    const newWords = words.slice(0, i).concat(words.slice(i + 1, words.length));
    return _forEachWordPermutation(newWords, callback, output.concat([w]));
  });
}

function runAll(sourceList, targetList) {
  return _.map(sourceList, function (sourceStr) {
    const results = _.map(targetList, function (targetStr) {
      return _.extend({ target: targetStr }, run(sourceStr, targetStr));
    });
    results.sort(function (r1, r2) {
      if (r1.coeff !== r2.coeff) {
        return r2.coeff - r1.coeff; // reverse;
      }
      return r1.target.localeCompare(r2.target);
    });
    return { source: sourceStr, results: results };
  });
}

function run(s1, s2) {
  const norms1 = _normalize(s1);
  const norms2 = _normalize(s2);

  let bestDist = Number.MAX_VALUE;
  _forEachWordPermutation(norms1.split(" "), function (s1perm) {
    bestDist = Math.min(bestDist, _string.levenshtein(s1perm, norms2));
    return bestDist > 0;
  }, []);

  const longestLength = Math.max(norms1.length, norms2.length);
  return {
    dist: bestDist,
    coeff: (longestLength - bestDist) / longestLength
  };
}


module.exports = {
  run: run,
  runAll: runAll
}
