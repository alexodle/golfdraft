'use strict';

const EventEmitter = require('events').EventEmitter;
import * as _ from 'lodash';

function Store() {}

_.extend(Store.prototype, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(this.changeEvent);
  },

  addChangeListener: function(callback) {
    this.on(this.changeEvent, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(this.changeEvent, callback);
  }

});

export default Store;
