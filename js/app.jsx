// @flow
'use strict';

// load css right away
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('../less/app.less');

const $ = require('jquery');
const ChatActions = require('./actions/ChatActions');
const React = require('react');
const ReactDOM = require('react-dom');
const Router = require('react-router');
const routes = require('./routes.jsx');

const router = Router.createRoutes({
  routes: routes,
  location: Router.HistoryLocation
});

// Hydrate the app with seed data before running
require('./hydrate')();

const node = document.getElementById('golfdraftapp');
ReactDOM.render(
  (<div className="container">
    <div className="row">
      <div className="col-md-offset-1 col-md-10">
        {routes}
      </div>
    </div>
  </div>),
  node
);


// Begin listening for live socket updates
require('./startSocketUpdates')();

// Lazily get chat messages
//
// TODO - move to separate server sync
$.getJSON('/chat/messages').success(ChatActions.setMessages);
