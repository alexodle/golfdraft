'use strict';

import * as _ from 'lodash';
import Store from './Store';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';

let _tourneyName = null;

const TourneyStore =  _.extend({}, Store.prototype, {

  getTourneyName: function () {
    return _tourneyName;
  }

});

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_TOURNEY_NAME:
      _tourneyName = action.tourneyName;
      TourneyStore.emitChange();
      break;
  }

  return true; // No errors. Needed by promise in Dispatcher.
});

export default TourneyStore;
