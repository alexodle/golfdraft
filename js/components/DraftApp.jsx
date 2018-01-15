'use strict';

const _ = require('lodash');
const AppPausedStatus = require('./AppPausedStatus.jsx');
const Assets = require('../constants/Assets');
const BestLeft = require('./BestLeft.jsx');
const ChatRoom = require('./ChatRoom.jsx');
const DraftChooser = require('./DraftChooser.jsx');
const DraftClock = require('./DraftClock.jsx');
const DraftHistory = require('./DraftHistory.jsx');
const DraftPickOrder = require('./DraftPickOrder.jsx');
const DraftStatus = require('./DraftStatus.jsx');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const Link = require('react-router').Link;
const PickListEditor = require('./PickListEditor.jsx');
const React = require('react');

const myTurnSound = new Audio(Assets.MY_TURN_SOUND);
const pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

const DraftApp = React.createClass({

  getInitialState: function () {
    return {
      draftHistoryUserId: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    const props = this.props;
    if (!props.isMyDraftPick && nextProps.isMyDraftPick) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
      pickMadeSound.play();
    }
  },

  _renderPickListHeader: function () {
    return (
      <span>
        <span>Pick List Editor</span>
        <span className='pull-right'><em>NEW!</em></span>
      </span>
    );
  },

  _renderPreDraft: function () {
    return (
      <section>

        <div className='row'>
          <div className='col-md-12'>
            <div className='jumbotron'>
              <h1>Draft not started.</h1>
              <em>New feature: <a href='#InlinePickListEditor'>Set up your pick list beforehand</a></em>
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <a name='InlinePickListEditor' />
            <GolfDraftPanel heading={this._renderPickListHeader()}>
              <PickListEditor
                preDraftMode
                golfersRemaining={this.props.golfersRemaining}
                syncedPickList={this.props.syncedPickList}
                pendingPickList={this.props.pendingPickList}
                height='30em'
              />
            </GolfDraftPanel>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <ChatRoom
              currentUser={this.props.currentUser}
              messages={this.props.chatMessages}
              activeUsers={this.props.activeUsers}
            />
          </div>
        </div>

      </section>
    );
  },

  _renderDraftComplete: function () {
    return (
      <section>

        <div className="row">
          <div className='col-md-12'>
            <div className='jumbotron'>
              <h1>The draft is over!</h1>
              <p><Link to='/'>Check out the live leaderboard</Link></p>
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <ChatRoom
              currentUser={this.props.currentUser}
              messages={this.props.chatMessages}
              activeUsers={this.props.activeUsers}
            />
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <DraftHistory
              draftPicks={this.props.draftPicks}
              selectedUserId={this.state.draftHistoryUserId}
              onSelectionChange={this._onDraftHistorySelectionChange}
            />
          </div>
        </div>

      </section>
    );
  },

  render: function () {
    if (!this.props.draftHasStarted) {
      return this._renderPreDraft();
    }

    const isDraftComplete = !this.props.currentPick;
    if (isDraftComplete) {
      return this._renderDraftComplete();
    }

    const isMyPick = this.props.isMyDraftPick;
    const isDraftPaused = this.props.isPaused;

    return (
      <div>
        {isDraftPaused ? (<AppPausedStatus />) : (
          <div className='row'>

            <div className='col-md-9'>
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
                />
              )}
            </div>

            <div className='col-md-3'>
              <DraftClock
                draftPicks={this.props.draftPicks}
                isMyPick={this.props.isMyDraftPick}
                allowClock={this.props.allowClock}
              />
            </div>
          </div>
        )}

        <div className='row'>

          <div className='col-md-4'>
            <GolfDraftPanel heading='Draft Order'>
              <a name='InlineDraftPickListEditor' />
              <DraftPickOrder
                currentUser={this.props.currentUser}
                currentPick={this.props.currentPick}
                pickingForUsers={this.props.pickingForUsers}
                autoPickUsers={this.props.autoPickUsers}
                onUserSelected={this._onDraftHistorySelectionChange}
              />
            </GolfDraftPanel>
          </div>

          <div className='col-md-8'>
            <GolfDraftPanel heading={this._renderPickListHeader()}>
              <PickListEditor
                golfersRemaining={this.props.golfersRemaining}
                syncedPickList={this.props.syncedPickList}
                pendingPickList={this.props.pendingPickList}
                height='29em'
              />
            </GolfDraftPanel>
          </div>

        </div>

        <div className='row'>
          <div className='col-md-12'>
            <ChatRoom
              currentUser={this.props.currentUser}
              messages={this.props.chatMessages}
              activeUsers={this.props.activeUsers}
            />
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <DraftHistory
              draftPicks={this.props.draftPicks}
              selectedUserId={this.state.draftHistoryUserId}
              onSelectionChange={this._onDraftHistorySelectionChange}
            />
          </div>
        </div>

      </div>
    );
  },

  _onDraftHistorySelectionChange: function (userId) {
    this.setState({ draftHistoryUserId: userId });
  }

});

module.exports = DraftApp;
