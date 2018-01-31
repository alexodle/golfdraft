"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    yahoo: {
        reader: require('./yahooReader'),
        nameMap: {}
    },
    pgatour: {
        reader: require('./pgatourReader'),
        nameMap: {}
    },
    pgatour_field: {
        reader: require('./pgatourFieldReader'),
        nameMap: {}
    }
};
