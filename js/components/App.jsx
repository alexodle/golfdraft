// @flow
'use strict';

const _ = require("lodash");
const AdminApp = require("./AdminApp.jsx");
const AppHeader = require("./AppHeader.jsx");
const AppSettingsStore = require('../stores/AppSettingsStore');
const ChatStore = require("../stores/ChatStore");
const DraftApp = require("./DraftApp.jsx");
const DraftStore = require("../stores/DraftStore");
const GolferStore = require("../stores/GolferStore");
const React = require("react");
const Router = require('react-router-dom');
const ScoreStore = require('../stores/ScoreStore');
const TourneyApp = require("./TourneyApp.jsx");
const TourneyStore = require("../stores/TourneyStore");
const UserStore = require("../stores/UserStore");
const WhoIsYou = require("./WhoIsYou.jsx");

const Route = Router.Route;

const RELEVANT_STORES = [
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
    users: UserStore.getAll(),

    draft: {
      isMyDraftPick: DraftStore.getIsMyDraftPick(),
      currentPick: DraftStore.getCurrentPick(),
      draftPicks: DraftStore.getDraftPicks(),
      pickingForUsers: DraftStore.getPickingForUsers(),
      syncedPickList: DraftStore.getPickList(),
      pendingPickList: DraftStore.getPendingPickList()
    },

    scores: ScoreStore.getScores(),
    lastScoresUpdate: ScoreStore.getLastUpdated(),

    chatMessages: ChatStore.getMessages(),

    isAdmin: UserStore.isAdmin(),
    isPaused: AppSettingsStore.getIsPaused(),
    allowClock: AppSettingsStore.getAllowClock(),
    draftHasStarted: AppSettingsStore.getDraftHasStarted(),
    autoPickUsers: AppSettingsStore.getAutoPickUsers()
  };
}

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

function getGolfersRemaining(golfers, draftPicks) {
  const pickedGolfers = _.pluck(draftPicks, "golfer");
  const golfersRemaining = _.omit(golfers, pickedGolfers);
  return golfersRemaining;
}

class DraftWrapper extends React.Component {
  childContextTypes: {
    location: React.PropTypes.object
  }

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          location={props.location}
          drafting
        />
        <DraftApp
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          currentPick={props.draft.currentPick}
          isMyDraftPick={props.draft.isMyDraftPick}
          draftPicks={props.draft.draftPicks}
          chatMessages={props.chatMessages}
          isPaused={props.isPaused}
          golfersRemaining={props.golfersRemaining}
          pickingForUsers={props.draft.pickingForUsers}
          activeUsers={props.activeUsers}
          allowClock={props.allowClock}
          syncedPickList={props.draft.syncedPickList}
          pendingPickList={props.draft.pendingPickList}
          draftHasStarted={props.draftHasStarted}
          autoPickUsers={props.autoPickUsers}
        />
      </section>
    );
  }

};

class TourneyWrapper extends React.Component {
  childContextTypes: {
    location: React.PropTypes.object
  }

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          location={props.location}
        />
        <TourneyApp
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          scores={props.scores}
          draft={props.draft}
          lastScoresUpdate={props.lastScoresUpdate}
          chatMessages={props.chatMessages}
          activeUsers={props.activeUsers}
        />
      </section>
    );
  }

};

class AdminWrapper extends React.Component {
  childContextTypes: {
    location: React.PropTypes.object
  }

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
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
          draftHasStarted={props.draftHasStarted}
          users={props.users}
          autoPickUsers={props.autoPickUsers}
        />
      </section>
    );
  }

};

class AppNode extends React.Component {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return getAppState();
  }

  componentDidMount() {
    _.each(RELEVANT_STORES, function (S) {
      S.addChangeListener(this._onChange);
    }, this);
  }

  componentWillUnmount() {
    _.each(RELEVANT_STORES, function (S) {
      S.removeChangeListener(this._onChange);
    }, this);
  }

  render() {
    const state = this.state;

    // Calculated here since it's used in multiple places
    const golfersRemaining = getGolfersRemaining(
      state.golfers,
      state.draft.draftPicks
    );

    function connect(Component) {
      return class extends React.Component {
        render() {
          return (<Component {...this.props} {...state} golfersRemaining={golfersRemaining} />);
        }
      };
    }

    return (
      <div>
        <Route
          component={connect(TourneyWrapper)}
          onEnter={function (nextState, replace) {
            requireAuth(nextState, replace) && requireDraftDone(nextState, replace);
          }}
          path="/"
        />
        <Route path="draft" component={connect(DraftWrapper)} onEnter={requireAuth} />
        <Route path="whoisyou" component={connect(WhoIsYou)} />
        <Route path="admin" component={connect(AdminWrapper)} />
      </div>
    );

    return React.cloneElement(this.props.children, {
      ...state,
      golfersRemaining: golfersRemaining
    });
  }

  _onChange() {
    this.setState(getAppState());
  }

};

module.exports = {
  AdminWrapper: AdminWrapper,
  AppNode: AppNode,
  DraftWrapper: DraftWrapper,
  TourneyWrapper: TourneyWrapper,
  WhoIsYou: WhoIsYou
};
