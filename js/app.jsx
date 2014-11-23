/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 */

'use strict';

// load css right away
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('../less/app.less');

var React = require('react');

var App = require('./components/App.jsx');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');

React.render(
  (<div className="container">
    <div className="row">
      <div className="col-md-offset-1 col-md-10">
        <App />
      </div>
    </div>
  </div>),
  document.getElementById('golfdraftapp')
);

// TODO - Move
// Hook up socket updates
var socketio = require('socket.io-client');
var io = socketio.connect();
io.on('change:draft', function (ev) {
  DraftActions.draftUpdate(ev.data);
});
io.on('change:scores', function (ev) {
  ScoreActions.scoreUpdate(ev.data);
});
