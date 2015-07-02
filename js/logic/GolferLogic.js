'use strict';

var constants = require('../../common/constants');

var UNKNOWN_WGR = constants.UNKNOWN_WGR;

var GolferLogic = {

  renderGolfer: function (g) {
    var wgrDisplay = g.wgr === UNKNOWN_WGR ? '' : ' (WGR: ' + g.wgr + ')';
    return g.name + wgrDisplay;
  }

};

module.exports = GolferLogic;
