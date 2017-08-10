"use strict";

var _ = require("lodash");
var AdminApp = require("./AdminApp.jsx");
var AppHeader = require("./AppHeader.jsx");
var AppSettingsStore = require('../stores/AppSettingsStore');
var ChatStore = require("../stores/ChatStore");
var ChatStore = require("../stores/ChatStore");
var DraftApp = require("./DraftApp.jsx");
var DraftStore = require("../stores/DraftStore");
var React = require("react");
var ScoreStore = require('../stores/ScoreStore');
var TourneyApp = require("./TourneyApp.jsx");
var TourneyStore = require("../stores/TourneyStore");
var UserStore = require("../stores/UserStore");
var GolferStore = require("../stores/GolferStore");
var WhoIsYou = require("./WhoIsYou.jsx");

var RELEVANT_STORES = [
  AppSettingsStore,
  ChatStore,
  DraftStore,
  ScoreStore,
  UserStore
];

function getAppState() {
  return {
    tourneyName: TourneyStore.getTourneyName(),
    currentUser: UserStore.getCurrentUser(),
    activeUsers: UserStore.getActive(),
    golfers: GolferStore.getAll(),

    draft: {
      isMyDraftPick: DraftStore.getIsMyDraftPick(),
      currentPick: DraftStore.getCurrentPick(),
      draftPicks: DraftStore.getDraftPicks(),
      pickingForPlayers: DraftStore.getPickingForPlayers()
    },

    scores: ScoreStore.getScores(),
    lastScoresUpdate: ScoreStore.getLastUpdated(),
    refreshRate: TourneyStore.getRefreshRate(),

    playSounds: AppSettingsStore.getPlaySounds(),

    chatMessages: ChatStore.getMessages(),

    isAdmin: UserStore.isAdmin(),
    isPaused: AppSettingsStore.getIsPaused(),
    allowClock: AppSettingsStore.getAllowClock()
  };
}

function getGolfersRemaining(golfers, draftPicks) {
  var pickedGolfers = _.pluck(draftPicks, "golfer");
  var golfersRemaining = _.omit(golfers, pickedGolfers);
  return golfersRemaining;
}

var DraftWrapper = React.createClass({

  childContextTypes: {
    location: React.PropTypes.object
  },

  render: function () {
    var props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          playSounds={props.playSounds}
          location={props.location}
          drafting
        />
        <DraftApp
          tourneyName={props.tourneyName}
          playSounds={props.playSounds}
          currentUser={props.currentUser}
          currentPick={props.draft.currentPick}
          isMyDraftPick={props.draft.isMyDraftPick}
          draftPicks={props.draft.draftPicks}
          chatMessages={props.chatMessages}
          isPaused={props.isPaused}
          golfersRemaining={props.golfersRemaining}
          pickingForPlayers={props.draft.pickingForPlayers}
          activeUsers={props.activeUsers}
          allowClock={props.allowClock}
        />
      </section>
    );
  }

});

var TourneyWrapper = React.createClass({

  childContextTypes: {
    location: React.PropTypes.object
  },

  render: function () {
    var props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          playSounds={props.playSounds}
          location={props.location}
        />
        <TourneyApp
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          scores={props.scores}
          draft={props.draft}
          lastScoresUpdate={props.lastScoresUpdate}
          refreshRate={props.refreshRate}
          chatMessages={props.chatMessages}
          activeUsers={props.activeUsers}
        />
      </section>
    );
  }

});

var AdminWrapper = React.createClass({

  childContextTypes: {
    location: React.PropTypes.object
  },

  render: function () {
    var props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          playSounds={props.playSounds}
          location={props.location}
        />
        <AdminApp
          isAdmin={props.isAdmin}
          currentUser={props.currentUser}
          currentPick={props.draft.currentPick}
          draftPicks={props.draft.draftPicks}
          isPaused={props.isPaused}
          golfersRemaining={props.golfersRemaining}
          activeUsers={props.activeUsers}
          allowClock={props.allowClock}
        />
      </section>
    );
  }

});

var AppNode = React.createClass({

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
    var state = this.state;

    // Calculated here since it's used in multiple places
    var golfersRemaining = getGolfersRemaining(
      state.golfers,
      state.draft.draftPicks
    );

    return React.cloneElement(this.props.children, {
      ...state,
      golfersRemaining: golfersRemaining
    });
  },

  _onChange: function () {
    this.setState(getAppState());
  }

});

module.exports = {
  AdminWrapper: AdminWrapper,
  AppNode: AppNode,
  DraftWrapper: DraftWrapper,
  TourneyWrapper: TourneyWrapper,
  WhoIsYou: WhoIsYou
};
