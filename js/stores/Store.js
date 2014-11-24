'use strict';

var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

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

module.exports = Store;
