'use strict';

const App = require('./components/App.jsx');
const DraftStore = require('./stores/DraftStore');
const React = require('react');
const ReactRouter = require('react-router');
const UserStore = require('./stores/UserStore');

const Router = ReactRouter.Router;
const Route = ReactRouter.Route;
const NotFoundRoute = ReactRouter.NotFoundRoute;
const IndexRoute = ReactRouter.IndexRoute;
const browserHistory = ReactRouter.browserHistory;

const AdminWrapper = App.AdminWrapper;
const AppNode = App.AppNode;
const DraftWrapper = App.DraftWrapper;
const TourneyWrapper = App.TourneyWrapper;
const WhoIsYou = App.WhoIsYou;

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

const routes = (
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
