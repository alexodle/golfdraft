// @flow
'use strict';

const keyMirror = require('fbjs/lib/keyMirror');

const AppConstants = keyMirror({
  CURRENT_USER_CHANGE: null,
  CURRENT_USER_CHANGE_SYNCED: null,
  SET_ACTIVE_USERS: null,
  SET_APP_STATE: null,
  SET_GOLFERS: null,
  SET_IS_ADMIN: null,
  SET_TOURNEY_NAME: null,
  SET_USERS: null
});

AppConstants.PROPERTY_LOADING = { 'PROPERTY_LOADING': 'PROPERTY_LOADING' };

module.exports = AppConstants;
