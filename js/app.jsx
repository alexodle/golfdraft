/** @jsx React.DOM */
'use strict';

// load css right away
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('../less/app.less');

var DraftActions = require('./actions/DraftActions');
var React = require('react');
var Router = require('react-router');
var routes = require('./routes.jsx');
var ScoreActions = require('./actions/ScoreActions');

var router = Router.create({
  routes: routes,
  location: Router.HistoryLocation
});

var node = document.getElementById('golfdraftapp');
router.run(function (Handler, state) {
  React.render(
    (<div className="container">
      <div className="row">
        <div className="col-md-offset-1 col-md-10">
          <Handler />
        </div>
      </div>
    </div>),
    node
  );
});


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
