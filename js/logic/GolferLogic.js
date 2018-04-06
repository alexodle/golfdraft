'use strict';

var constants = require('../../common/constants');

var UNKNOWN_WGR = constants.UNKNOWN_WGR;

var GolferLogic = {

  renderGolfer: function (g) {
    var wgrDisplay = g.wgr === UNKNOWN_WGR ? '' : ' (WGR: ' + g.wgr + ')';
    var amDisplay = g.amateur ? ' (A)' : '';
    var scDisplay = ' (' + g.score +')'
    return g.name + scDisplay + amDisplay + wgrDisplay;
  }

};

module.exports = GolferLogic;
