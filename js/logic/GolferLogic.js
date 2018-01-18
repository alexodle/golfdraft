'use strict';

import constants from '../../common/constants';

const UNKNOWN_WGR = constants.UNKNOWN_WGR;

const GolferLogic = {

  renderGolfer: function (g) {
    const wgrDisplay = g.wgr === UNKNOWN_WGR ? '' : ' (WGR: ' + g.wgr + ')';
    return g.name + wgrDisplay;
  }

};

export default GolferLogic;
