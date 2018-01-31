"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../common/constants");
const UNKNOWN_WGR = constants_1.default.UNKNOWN_WGR;
class GolferLogic {
    static renderGolfer(g) {
        const wgrDisplay = g.wgr === UNKNOWN_WGR ? '' : ' (WGR: ' + g.wgr + ')';
        return g.name + wgrDisplay;
    }
}
exports.default = GolferLogic;
;
