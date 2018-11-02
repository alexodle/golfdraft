import {omit} from 'lodash';
import * as React from 'react';
import AdminApp from './AdminApp';
import AppHeader from './AppHeader';
import AppSettingsStore from '../stores/AppSettingsStore';
import ChatStore from '../stores/ChatStore';
import DraftApp from './DraftApp';
import DraftStore from '../stores/DraftStore';
import GolferStore from '../stores/GolferStore';
import ScoreStore from '../stores/ScoreStore';
import TourneyApp from './TourneyApp';
import TourneyStore from '../stores/TourneyStore';
import UserStore from '../stores/UserStore';
import WhoIsYou from './WhoIsYou';
import {DraftProps} from '../types/SharedProps';
import {Route, Switch, Redirect} from 'react-router-dom';
import constants from '../../common/constants';
import {
  ChatMessage,
  DraftPick,
  DraftPickOrder,
  Golfer,
  Indexed,
  IndexedGolfers,
  TourneyStandings,
  IndexedUsers,
  Location,
  User,
} from '../types/ClientTypes';

const RELEVANT_STORES = [
  AppSettingsStore,
  ChatStore,
  DraftStore,
  ScoreStore,
  UserStore
];

interface AppState {
  tourneyName: string;
  currentUser?: User;
  activeUsers: Indexed<string>;
  golfers: IndexedGolfers;
  users: IndexedUsers;
  draft: DraftProps;
  tourneyStandings: TourneyStandings;
  lastScoresUpdate: Date;
  chatMessages?: ChatMessage[];
  isAdmin: boolean;
  isPaused: boolean;
  allowClock: boolean;
  draftHasStarted: boolean;
  autoPickUsers: Indexed<string>;
}

interface ComponentProps extends AppState {
  location: Location;
  match: {
    params: {[key: string]: string}
  };
  golfersRemaining: IndexedGolfers;
}

function getAppState(): AppState {
  return {
    tourneyName: TourneyStore.getTourneyName(),
    currentUser: UserStore.getCurrentUser(),
    activeUsers: UserStore.getActive(),
    golfers: GolferStore.getAll(),
    users: UserStore.getAll(),

    draft: {
      pickOrder: DraftStore.getPickOrder(),
      isMyDraftPick: DraftStore.getIsMyDraftPick(),
      currentPick: DraftStore.getCurrentPick(),
      draftPicks: DraftStore.getDraftPicks(),
      pickingForUsers: DraftStore.getPickingForUsers(),
      syncedPickList: DraftStore.getPickList(),
      pendingPickList: DraftStore.getPendingPickList()
    },

    tourneyStandings: ScoreStore.getTourneyStandings(),
    lastScoresUpdate: ScoreStore.getLastUpdated(),

    chatMessages: ChatStore.getMessages(),

    isAdmin: UserStore.isAdmin(),
    isPaused: AppSettingsStore.getIsPaused(),
    allowClock: AppSettingsStore.getAllowClock(),
    draftHasStarted: AppSettingsStore.getDraftHasStarted(),
    autoPickUsers: AppSettingsStore.getAutoPickUsers()
  };
}

function getGolfersRemaining(golfers: IndexedGolfers, draftPicks: DraftPick[]): IndexedGolfers {
  const pickedGolfers = draftPicks.map(dp => dp.golfer);
  const golfersRemaining = omit(golfers, pickedGolfers);
  return golfersRemaining;
}

class DraftWrapper extends React.Component<ComponentProps, {}> {

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
          drafting
        />
        <DraftApp
          currentUser={props.currentUser}
          currentPick={props.draft.currentPick}
          isMyDraftPick={props.draft.isMyDraftPick}
          draftPicks={props.draft.draftPicks}
          chatMessages={props.chatMessages}
          isPaused={props.isPaused}
          golfersRemaining={props.golfersRemaining}
          pickingForUsers={props.draft.pickingForUsers}
          pickOrder={props.draft.pickOrder}
          activeUsers={props.activeUsers}
          allowClock={props.allowClock}
          syncedPickList={props.draft.syncedPickList}
          pendingPickList={props.draft.pendingPickList}
          draftHasStarted={props.draftHasStarted}
          autoPickUsers={props.autoPickUsers}
          tourneyId={props.match.params.tourneyId}
        />
      </section>
    );
  }

};

class TourneyWrapper extends React.Component<ComponentProps, {}> {

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
        />
        <TourneyApp
          currentUser={props.currentUser}
          tourneyStandings={props.tourneyStandings}
          draft={props.draft}
          lastScoresUpdate={props.lastScoresUpdate}
          chatMessages={props.chatMessages}
          activeUsers={props.activeUsers}
        />
      </section>
    );
  }

};

class HistoryWrapper extends React.Component<ComponentProps, {}> {

  render() {
    const props = this.props;
    return (
      <h1>HISTORY ROCKS!</h1>
    );
  }

}

class AdminWrapper extends React.Component<ComponentProps, {}> {

  render() {
    const props = this.props;
    return (
      <section>
        <AppHeader
          tourneyName={props.tourneyName}
          currentUser={props.currentUser}
        />
        <AdminApp
          isAdmin={props.isAdmin}
          currentPick={props.draft.currentPick}
          draftPicks={props.draft.draftPicks}
          isPaused={props.isPaused}
          allowClock={props.allowClock}
          draftHasStarted={props.draftHasStarted}
          users={props.users}
          autoPickUsers={props.autoPickUsers}
        />
      </section>
    );
  }

};

export interface AppNodeProps {}

export default class AppNode extends React.Component<AppNodeProps, AppState> {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return getAppState();
  }

  componentDidMount() {
    RELEVANT_STORES.forEach(s => {
      s.addChangeListener(this._onChange);
    });
  }

  componentWillUnmount() {
    RELEVANT_STORES.forEach(s => {
      s.removeChangeListener(this._onChange);
    });
  }

  _requireCurrentUser(from) {
    if (!this.state.currentUser) {
      return (<Redirect to={{ pathname: '/whoisyou', state: { from: from }}} />);
    }
  }

  _requireDraftComplete(from) {
    if (this.state.draft.currentPick) {
      return (<Redirect to={{ pathname: 'draft', state: { from: from }}} />);
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
    const renderHistoryWrapper = (props) => (<HistoryWrapper {...props} {...state} />);

    return (
      <Switch>
        <Route exact path={`/${constants.TOURNEY_ID_PARAM}/draft`} render={renderDraftWrapper}/>
        <Route exact path='/whoisyou' render={renderWhoIsYou}/>
        <Route exact path='/admin' render={renderAdminWrapper}/>
        <Route exact path='/history' render={renderHistoryWrapper}/>
        <Route exact path={`/${constants.TOURNEY_ID_PARAM}`} render={renderTourneyWrapper} />
      </Switch>
    );
  }

  _onChange = () => {
    this.setState(getAppState());
  }

};
