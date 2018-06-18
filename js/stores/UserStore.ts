import * as _ from 'lodash';
import AppConstants from '../constants/AppConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';
import Store from './Store';
import UserActions from '../actions/UserActions';
import {User, IndexedUsers, Indexed} from '../types/ClientTypes';
import {post} from '../fetch';

let _currentUser: string = null;
let _users: IndexedUsers = null;
let _isAdmin: boolean = false;
let _activeUsers: Indexed<string> = null; // active users indexed by user id

class UserStoreImpl extends Store {
  changeEvent() { return 'UserStore:change'; }
  getCurrentUser() { return _users[_currentUser]; }
  getUser(userId: string) { return _users[userId]; }
  getUserByName(name: string) { return _.find(_users, { name }); }
  isAdmin() { return _isAdmin; }
  getAll() { return _users; }
  getActive() { return _activeUsers; }
}
const UserStore = new UserStoreImpl();

// Register to handle all updates
AppDispatcher.register(function (payload) {
  const action = payload.action;

  switch(action.actionType) {

    case AppConstants.SET_USERS:
      _users = _.keyBy(action.users, '_id');
      UserStore.emitChange();
      break;

    case AppConstants.CURRENT_USER_CHANGE:
      _currentUser = action.currentUser;

      if (!_currentUser && !action.doNotSync) {
        post('/logout')
          .then(function () {
            UserActions.setCurrentUserSynced();
          })
          .catch(function () {
            window.location.reload();
          });
      } else {
        UserActions.setCurrentUserSynced();
      }

      UserStore.emitChange();
      break;

    case AppConstants.SET_IS_ADMIN:
      _isAdmin = action.isAdmin;
      UserStore.emitChange();
      break;

    case AppConstants.SET_ACTIVE_USERS:
      _activeUsers = _.keyBy(action.activeUsers);
      UserStore.emitChange();
      break;

  }

  return true; // No errors.  Needed by promise in Dispatcher.
});

export default UserStore;
