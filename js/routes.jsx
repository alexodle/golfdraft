/** @jsx React.DOM */
'use strict';

var App = require('./components/App.jsx');
var React = require('react');
var Router = require('react-router');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;

var AdminWrapper = App.AdminWrapper;
var AppNode = App.AppNode;
var DraftWrapper = App.DraftWrapper;
var TourneyWrapper = App.TourneyWrapper;
var WhoIsYouWrapper = App.WhoIsYouWrapper;

var routes = (
  <Route handler={AppNode} path="/">
    <DefaultRoute name="whoisyou" handler={WhoIsYouWrapper} />
    <Route name="draft" handler={DraftWrapper} />
    <Route name="tourney" handler={TourneyWrapper} />
    <Route name="admin" handler={AdminWrapper} />
  </Route>
);

module.exports = routes;
