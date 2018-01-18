'use strict';

import * as _ from 'lodash';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import Store from './Store';

let _golfers = {};

const GolferStore =  _.extend({}, Store.prototype, {

  changeEvent: 'GolferStore:change',

  getAll: function () {
    return _golfers;
  },

  getGolfer: function (id) {
    return _golfers[id];
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_GOLFERS:
      _golfers = _.indexBy(action.golfers, '_id');
      GolferStore.emitChange();
      break;
  }
});

export default GolferStore;
