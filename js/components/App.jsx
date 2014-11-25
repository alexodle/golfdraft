/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var AppSettingsStore = require('../stores/AppSettingsStore');
var DraftApp = require("./DraftApp.jsx");
var DraftStore = require("../stores/DraftStore");
var React = require("react");
var Router = require('react-router');
var ScoreStore = require('../stores/ScoreStore');
var TourneyApp = require("./TourneyApp.jsx");
var UserStore = require("../stores/UserStore");
var WhoIsYou = require("./WhoIsYou.jsx");

var RouteHandler = Router.RouteHandler;
var Navigation = Router.Navigation;
var RouterState = Router.State;

var RELEVANT_STORES = [
  UserStore,
  DraftStore,
  ScoreStore,
  AppSettingsStore
];

function getAppState() {
  return {
    currentUser: UserStore.getCurrentUser(),

    draft: {
      currentPick: DraftStore.getCurrentPick(),
      draftPicks: DraftStore.getDraftPicks()
    },

    scores: ScoreStore.getScores(),
    lastScoresUpdate: ScoreStore.getLastUpdated(),

    playSounds: AppSettingsStore.getPlaySounds()
  };
}

function getCurrentRoute(state) {
  state = state || getAppState();
  if (!state.currentUser) {
    return 'whoisyou';
  } else if (state.draft.currentPick) {
    return 'draft';
  } else {
    return 'tourney';
  }
}

function createWillTransitionTo(allowedRoute) {
  return function (transition) {
    var route = getCurrentRoute();
    if (route !== allowedRoute) {
      transition.redirect(route);
    }
  };
}

var WhoIsYouWrapper = React.createClass({

  statics: {
    willTransitionTo: createWillTransitionTo('whoisyou')
  },

  render: function () {
    return (
      <WhoIsYou />
    );
  }

});

var DraftWrapper = React.createClass({

  statics: {
    willTransitionTo: createWillTransitionTo('draft')
  },

  render: function () {
    var props = this.props;
    return (
      <DraftApp
        playSounds={props.playSounds}
        currentUser={props.currentUser}
        currentPick={props.draft.currentPick}
        draftPicks={props.draft.draftPicks}
      />
    );
  }

});

var TourneyWrapper = React.createClass({

  statics: {
    willTransitionTo: createWillTransitionTo('tourney')
  },

  render: function () {
    var props = this.props;
    return (
      <TourneyApp
        currentUser={props.currentUser}
        scores={props.scores}
        draft={props.draft}
        lastScoresUpdate={props.lastScoresUpdate}
      />
    );
  }

});

var AppNode = React.createClass({
  mixins: [Navigation, RouterState],

  getInitialState: function () {
    return getAppState();
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    var currRoute = _.last(this.getRoutes()).name;
    var newRoute = getCurrentRoute(nextState);
    var routeChange = newRoute !== currRoute;
    if (routeChange) {
      this.transitionTo(newRoute);
    }
    return !routeChange;
  },

  componentDidMount: function () {
    _.each(RELEVANT_STORES, function (S) {
      S.addChangeListener(this._onChange);
    }, this);
  },

  componentWillUnmount: function () {
    _.each(RELEVANT_STORES, function (S) {
      S.removeChangeListener(this._onChange);
    }, this);
  },

  render: function () {
    return (<RouteHandler {...this.state} />);
  },

  _onChange: function () {
    this.setState(getAppState());
  }

});

module.exports = {
  AppNode: AppNode,
  WhoIsYouWrapper: WhoIsYouWrapper,
  DraftWrapper: DraftWrapper,
  TourneyWrapper: TourneyWrapper
};

// HACKHACK
window.React = React;
