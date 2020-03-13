import { isEmpty, sortBy } from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import '../../less/tourney_app.less';
import Assets from '../constants/Assets';
import { ChatMessage, DraftPick, DraftPickOrder, Indexed, IndexedGolfers, User } from '../types/ClientTypes';
import AppPausedStatus from './AppPausedStatus';
import ChatRoom from './ChatRoom';
import DraftChooser from './DraftChooser';
import DraftClock from './DraftClock';
import DraftHistory from './DraftHistory';
import DraftPickOrderView from './DraftPickOrderView';
import DraftStatus from './DraftStatus';
import GolfDraftPanel from './GolfDraftPanel';
import PickListEditor from './PickListEditor';

const myTurnSound = new Audio(Assets.MY_TURN_SOUND);
const pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

export interface DraftAppProps {
  draftPicks: DraftPick[];
  pickOrder: DraftPickOrder[];
  isMyDraftPick: boolean;
  golfersRemaining: IndexedGolfers;
  syncedPickList: string[];
  pendingPickList: string[];
  currentUser: User;
  chatMessages: ChatMessage[];
  activeUsers: Indexed<string>;
  currentPick?: DraftPickOrder;
  pickingForUsers: string[];
  autoPickUsers: Indexed<string>;
  pickListUsers: Indexed<string>;
  allowClock: boolean;
  draftHasStarted: boolean;
  isPaused: boolean;
  tourneyId: string;
  isViewingActiveTourney: boolean;
}

export interface DraftAppState {
  draftHistoryUserId?: string;
}

export default class DraftApp extends React.Component<DraftAppProps, DraftAppState> {

  constructor(props) {
    super(props);
    this.state = { draftHistoryUserId: null };
  }

  componentWillReceiveProps(nextProps: DraftAppProps) {
    const props = this.props;
    if (!props.isMyDraftPick && nextProps.isMyDraftPick) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
      pickMadeSound.play();
    }
  }

  _renderPreDraft() {
    return (
      <section>

        <div className='jumbotron'>
          <h1>Draft not started.</h1>
        </div>

        <section>
          <a id='InlinePickListEditor' />
          <GolfDraftPanel heading='Pick List Editor'>
            <PickListEditor
              preDraftMode
              golfersRemaining={this.props.golfersRemaining}
              syncedPickList={this.props.syncedPickList}
              pendingPickList={this.props.pendingPickList}
              height='30em'
            />
          </GolfDraftPanel>
        </section>

        <section>
          <ChatRoom
            currentUser={this.props.currentUser}
            messages={this.props.chatMessages}
            activeUsers={this.props.activeUsers}
            enabled={this.props.isViewingActiveTourney}
          />
        </section>

      </section >
    );
  }

  _renderDraftComplete() {
    return (
      <section>
        <div className='jumbotron'>
          <h1>The draft is over!</h1>
          <p><Link to={`/${this.props.tourneyId}`}>Check out the live leaderboard</Link></p>
        </div>

        <section>
          <ChatRoom
            currentUser={this.props.currentUser}
            messages={this.props.chatMessages}
            activeUsers={this.props.activeUsers}
            enabled={this.props.isViewingActiveTourney}
          />
        </section>

        <section>
          <DraftHistory
            draftPicks={this.props.draftPicks}
            selectedUserId={this.state.draftHistoryUserId}
            onSelectionChange={this._onDraftHistorySelectionChange}
          />
        </section>

      </section>
    );
  }

  render() {
    if (!this.props.draftHasStarted) {
      return this._renderPreDraft();
    }

    const isDraftComplete = !this.props.currentPick;
    if (isDraftComplete) {
      return this._renderDraftComplete();
    }

    const isMyPick = this.props.isMyDraftPick;
    const isDraftPaused = this.props.isPaused;
    let syncedPickListForEditor = this.props.syncedPickList;
    if (this.props.syncedPickList !== null && isEmpty(this.props.syncedPickList)) {
      syncedPickListForEditor = sortBy(this.props.golfersRemaining, g => g.wgr, g => g.name).map(g => g._id);
    }

    const pendingPickListForEditor = this.props.pendingPickList === null || !isEmpty(this.props.pendingPickList) ?
      this.props.pendingPickList :
      syncedPickListForEditor;

    return (
      <section className={'draft ' + (isDraftPaused ? 'draft-paused' : 'draft-active')}>
        {isDraftPaused ? <section className='app-paused-section'><AppPausedStatus /></section> : (
          <React.Fragment>
            <section className='chooser-section'>
              {!isMyPick ? (
                <GolfDraftPanel heading='Draft Status'>
                  <DraftStatus currentPick={this.props.currentPick} />
                </GolfDraftPanel>
              ) : (
                  <DraftChooser
                    currentUser={this.props.currentUser}
                    golfersRemaining={this.props.golfersRemaining}
                    currentPick={this.props.currentPick}
                    syncedPickList={this.props.syncedPickList}
                    pickListUsers={this.props.pickListUsers}
                  />
                )}
            </section>

            <section className='draft-clock-section'>
              <DraftClock
                draftPicks={this.props.draftPicks}
                isMyPick={this.props.isMyDraftPick}
                allowClock={this.props.allowClock}
              />
            </section>

          </React.Fragment>
        )}

        <section className='draft-order-section'>
          <GolfDraftPanel heading='Draft Order'>
            <DraftPickOrderView
              pickOrder={this.props.pickOrder}
              currentUser={this.props.currentUser}
              currentPick={this.props.currentPick}
              pickingForUsers={this.props.pickingForUsers}
              autoPickUsers={this.props.autoPickUsers}
              pickListUsers={this.props.pickListUsers}
              onUserSelected={this._onDraftHistorySelectionChange}
            />
          </GolfDraftPanel>
        </section>

        <section className='pick-list-section'>
          <GolfDraftPanel heading='Pick List'>
            <PickListEditor
              golfersRemaining={this.props.golfersRemaining}
              syncedPickList={syncedPickListForEditor}
              pendingPickList={pendingPickListForEditor}
              height='29em'
            />
          </GolfDraftPanel>
        </section>


        <section className='chatroom-section'>
          <ChatRoom
            currentUser={this.props.currentUser}
            messages={this.props.chatMessages}
            activeUsers={this.props.activeUsers}
            enabled={this.props.isViewingActiveTourney}
          />
        </section>

        <section className='draft-history-section'>
          <DraftHistory
            draftPicks={this.props.draftPicks}
            selectedUserId={this.state.draftHistoryUserId}
            onSelectionChange={this._onDraftHistorySelectionChange}
          />
        </section>

      </section>
    );
  }

  _onDraftHistorySelectionChange = (userId: string) => {
    this.setState({ draftHistoryUserId: userId });
  }

};
