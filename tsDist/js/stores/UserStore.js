"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppConstants_1 = require("../constants/AppConstants");
const AppDispatcher_1 = require("../dispatcher/AppDispatcher");
const Store_1 = require("./Store");
const UserActions_1 = require("../actions/UserActions");
const fetch_1 = require("../fetch");
let _currentUser = null;
let _users = null;
let _isAdmin = false;
let _activeUsers = null; // active user counts by user id
class UserStoreImpl extends Store_1.default {
    changeEvent() { return 'UserStore:change'; }
    getCurrentUser() { return _users[_currentUser]; }
    getUser(userId) { return _users[userId]; }
    getUserByName(name) { return _.find(_users, { name }); }
    isAdmin() { return _isAdmin; }
    getAll() { return _users; }
    getActive() { return _activeUsers; }
}
const UserStore = new UserStoreImpl();
// Register to handle all updates
AppDispatcher_1.default.register(function (payload) {
    const action = payload.action;
    switch (action.actionType) {
        case AppConstants_1.default.SET_USERS:
            _users = _.keyBy(action.users, '_id');
            UserStore.emitChange();
            break;
        case AppConstants_1.default.CURRENT_USER_CHANGE:
            _currentUser = action.currentUser;
            if (!_currentUser && !action.doNotSync) {
                fetch_1.post('/logout')
                    .then(function () {
                    UserActions_1.default.setCurrentUserSynced();
                })
                    .catch(function () {
                    window.location.reload();
                });
            }
            else {
                UserActions_1.default.setCurrentUserSynced();
            }
            UserStore.emitChange();
            break;
        case AppConstants_1.default.SET_IS_ADMIN:
            _isAdmin = action.isAdmin;
            UserStore.emitChange();
            break;
        case AppConstants_1.default.SET_ACTIVE_USERS:
            _activeUsers = action.activeUsers;
            UserStore.emitChange();
            break;
    }
    return true; // No errors.  Needed by promise in Dispatcher.
});
exports.default = UserStore;
