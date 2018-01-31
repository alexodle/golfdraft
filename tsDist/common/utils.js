"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
_.mixin({
    lock: function (fn) {
        return function () {
            return fn();
        };
    }
});
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
exports.getOrdinal = getOrdinal;
function toGolferScoreStr(n) {
    if (n === 0) {
        return 'E';
    }
    else if (n > 0) {
        return '+' + n;
    }
    else {
        return '' + n;
    }
}
exports.toGolferScoreStr = toGolferScoreStr;
function toThruStr(thru) {
    if (thru === null) {
        return 'NS';
    }
    else if (thru === 18) {
        return 'F';
    }
    else {
        return 'thru ' + thru;
    }
}
exports.toThruStr = toThruStr;
function oidsAreEqual(a, b) {
    // We may have ObjectId OR String values, so ensure to convert both toString before comparing
    return a.toString() === b.toString();
}
exports.oidsAreEqual = oidsAreEqual;
function containsObjectId(oidList, targetOid) {
    return _.some(oidList, _.partial(oidsAreEqual, targetOid));
}
exports.containsObjectId = containsObjectId;
