'use strict';

// @flow

// load css right away
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('../less/app.less');

const $ = require('jquery');
const AppNode = require('./components/App.jsx').AppNode;
const ChatActions = require('./actions/ChatActions');
const React = require('react');
const ReactDOM = require('react-dom');
const Router = require('react-router-dom');

const BrowserRouter = Router.BrowserRouter;
const Route = Router.Route;


function render(rootNode) {
  // Hydrate the app with seed data before running
  require('./hydrate')();

  ReactDOM.render(
    (<BrowserRouter>
      <div className="container">
        <div className="row">
          <div className="col-md-offset-1 col-md-10">
            <Route component={AppNode} path="/" />
          </div>
        </div>
      </div>
    </BrowserRouter>), rootNode);

  // Begin listening for live socket updates
  require('./startSocketUpdates')();

  // Lazily get chat messages
  //
  // TODO - move to separate server sync
  $.getJSON('/chat/messages').success(ChatActions.setMessages);
}

const node = document.getElementById('golfdraftapp');
if (node === null) {
  console.log('root node not found! golfdraftapp');
} else {
  render(node);
}
