import * as _ from 'lodash';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import Store from './Store';
import {Golfer, IndexedGolfers} from '../types/ClientTypes';

let _golfers: IndexedGolfers = null;

class GolferStoreImpl extends Store {
  changeEvent() { return 'GolferStore:change'; }
  getAll() { return _golfers; }
  getGolfer(id: string) {
    return _golfers[id];
  }
}
const GolferStore = new GolferStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {
    case AppConstants.SET_GOLFERS:
      _golfers = _.keyBy(action.golfers, '_id');
      GolferStore.emitChange();
      break;
  }

  return true;
});

export default GolferStore;
