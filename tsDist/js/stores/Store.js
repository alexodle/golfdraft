"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class Store extends events_1.EventEmitter {
    changeEvent() {
        throw Error("Not implemented");
    }
    emitChange() {
        this.emit(this.changeEvent());
    }
    addChangeListener(callback) {
        this.on(this.changeEvent(), callback);
    }
    removeChangeListener(callback) {
        this.removeListener(this.changeEvent(), callback);
    }
}
exports.default = Store;
;
