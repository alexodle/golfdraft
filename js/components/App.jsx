/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var UserStore = require("../stores/UserStore");
var DraftStore = require("../stores/DraftStore");
var ScoreStore = require('../stores/ScoreStore');
var AppSettingsStore = require('../stores/AppSettingsStore');

var DraftApp = require("./DraftApp.jsx");
var TourneyApp = require("./TourneyApp.jsx");
var WhoIsYou = require("./WhoIsYou.jsx");

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
  }
}

var App = React.createClass({

  getInitialState: function () {
    return getAppState();
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
    var view = null;
    if (!this.state.currentUser) {
      view = (<WhoIsYou />);
    } else if (this.state.draft.currentPick) {
      view = (
        <DraftApp
          playSounds={this.state.playSounds}
          currentUser={this.state.currentUser}
          currentPick={this.state.draft.currentPick}
          draftPicks={this.state.draft.draftPicks}
        />
      );
    } else {
      view = (
        <TourneyApp
          currentUser={this.state.currentUser}
          scores={this.state.scores}
          draft={this.state.draft}
          lastScoresUpdate={this.state.lastScoresUpdate}
        />
      );
    }
    return view;
  },

  _onChange: function () {
    this.setState(getAppState());
  }

});

module.exports = App;

// HACKHACK
window.React = React;
