"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    // Tournaments are 4 days
    NDAYS: 4,
    // Each user can draft 4 golfers
    NGOLFERS: 4,
    // We take the top 2 golfer scores for each day
    NSCORES_PER_DAY: 2,
    MISSED_CUT: 'MC',
    // Either too high, or non-existent
    UNKNOWN_WGR: Number.MAX_VALUE
};
