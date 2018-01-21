'use strict';

import * as _ from 'lodash';
import AdminApp from './AdminApp';
import AppHeader from './AppHeader';
import AppSettingsStore from '../stores/AppSettingsStore';
import ChatStore from '../stores/ChatStore';
import DraftApp from './DraftApp';
import DraftStore from '../stores/DraftStore';
import GolferStore from '../stores/GolferStore';
import * as React from 'react';
import * as Router from 'react-router-dom';
import ScoreStore from '../stores/ScoreStore';
import TourneyApp from './TourneyApp';
import TourneyStore from '../stores/TourneyStore';
import UserStore from '../stores/UserStore';
import WhoIsYou from './WhoIsYou';

const {Route, Switch, Redirect} = Router;

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

function getGolfersRemaining(golfers, draftPicks) {
  const pickedGolfers = _.map(draftPicks, 'golfer');
  const golfersRemaining = _.omit(golfers, pickedGolfers);
  return golfersRemaining;
}

class DraftWrapper extends React.Component {

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

  _requireCurrentUser(from) {
    if (!this.state.currentUser) {
      return (<Redirect to={{ pathname: '/whoisyou', state: { from: from }}} />);
    }
  }

  _requireDraftComplete(from) {
    if (this.state.draft.currentPick) {
      return (<Redirect to={{ pathname: '/draft', state: { from: from }}} />);
    }
  }

  render() {
    const state = this.state;

    // Calculated here since it's used in multiple places
    const golfersRemaining = getGolfersRemaining(
      state.golfers,
      state.draft.draftPicks
    );

    const renderTourneyWrapper = (props) => {
      return this._requireCurrentUser(props.location.pathname) || this._requireDraftComplete(props.location) || (
        <TourneyWrapper {...props} {...state} golfersRemaining={golfersRemaining} />
      );
    }

    const renderDraftWrapper = (props) => {
      return this._requireCurrentUser(props.location.pathname) || (
        <DraftWrapper {...props} {...state} golfersRemaining={golfersRemaining} />
      );
    }

    const renderWhoIsYou = (props) => (<WhoIsYou {...props} {...state} golfersRemaining={golfersRemaining} />);
    const renderAdminWrapper = (props) => (<AdminWrapper {...props} {...state} golfersRemaining={golfersRemaining} />);

    return (
      <Switch>
        <Route exact path='/' render={renderTourneyWrapper} />
        <Route exact path='/draft' render={renderDraftWrapper}/>
        <Route exact path='/whoisyou' render={renderWhoIsYou}/>
        <Route exact path='/admin' render={renderAdminWrapper}/>
      </Switch>
    );
  }

  _onChange = () => {
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
