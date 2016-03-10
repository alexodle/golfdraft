'use strict';

var App = require('./components/App.jsx');
var DraftStore = require('./stores/DraftStore');
var React = require('react');
var ReactRouter = require('react-router');
var UserStore = require('./stores/UserStore');

var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var NotFoundRoute = ReactRouter.NotFoundRoute;
var IndexRoute = ReactRouter.IndexRoute;
var browserHistory = ReactRouter.browserHistory;

var AdminWrapper = App.AdminWrapper;
var AppNode = App.AppNode;
var DraftWrapper = App.DraftWrapper;
var TourneyWrapper = App.TourneyWrapper;
var WhoIsYou = App.WhoIsYou;

function requireAuth(nextState, replace) {
  if (!UserStore.getCurrentUser()) {
    replace({
      pathname: '/whoisyou',
      state: { nextPathname: nextState.location.pathname }
    });
    return false;
  }
  return true;
}

function requireDraftDone(nextState, replace) {
  if (DraftStore.getCurrentPick()) {
    replace('/draft');
    return false;
  }
  return true;
}

var routes = (
  <Router history={browserHistory}>
    <Route component={AppNode} path="/">
      <IndexRoute
        component={TourneyWrapper}
        onEnter={function (nextState, replace) {
          requireAuth(nextState, replace) && requireDraftDone(nextState, replace);
        }}
      />
      <Route path="draft" component={DraftWrapper} onEnter={requireAuth} />
      <Route path="whoisyou" component={WhoIsYou} />
      <Route path="admin" component={AdminWrapper} />
    </Route>
  </Router>
);

module.exports = routes;
