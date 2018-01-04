"use strict";

const _ = require("lodash");
const AppPausedStatus = require('./AppPausedStatus.jsx');
const Assets = require("../constants/Assets");
const BestLeft = require("./BestLeft.jsx");
const ChatRoom = require("./ChatRoom.jsx");
const DraftChooser = require("./DraftChooser.jsx");
const DraftClock = require("./DraftClock.jsx");
const DraftHistory = require("./DraftHistory.jsx");
const DraftPickOrder = require("./DraftPickOrder.jsx");
const DraftStatus = require("./DraftStatus.jsx");
const GolfDraftPanel = require("./GolfDraftPanel.jsx");
const keyMirror = require('fbjs/lib/keyMirror');
const Link = require('react-router').Link;
const PickListEditor = require("./PickListEditor.jsx");
const React = require("react");
const SettingsActions = require("../actions/SettingsActions");

const myTurnSound = new Audio(Assets.MY_TURN_SOUND);
const pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

const DraftOver = React.createClass({

  render: function () {
    return (
      <div className="jumbotron">
        <h1>The draft is over!</h1>
        <p><Link to='/'>Check out the live leaderboard</Link></p>
      </div>
    );
  }

});

const DraftApp = React.createClass({

  getInitialState: function () {
    return {
      draftHistoryPlayerId: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    const props = this.props;
    if (!props.playSounds) return;

    if (!props.isMyDraftPick && nextProps.isMyDraftPick) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
      pickMadeSound.play();
    }
  },

  render: function () {
    const isMyPick = this.props.isMyDraftPick;
    const isDraftPaused = this.props.isPaused;
    const isDraftComplete = !this.props.currentPick;

    const priorityPanelHeader = (
      <span>
        <span>Pick Priorities</span>
        <span className="pull-right"><em>NEW!</em></span>
      </span>
    );

    return (
      <div>
        <div>
          {isDraftPaused ? (<AppPausedStatus />) : (
            isDraftComplete ? (
              <div className="row">
                <div className="col-md-12">
                  <DraftOver />
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-md-9">
                  {!isMyPick ? (
                    <GolfDraftPanel heading='Draft Status'>
                      <DraftStatus currentPick={this.props.currentPick} />
                    </GolfDraftPanel>
                  ) : (
                    <DraftChooser
                      currentUser={this.props.currentUser}
                      golfersRemaining={this.props.golfersRemaining}
                      currentPick={this.props.currentPick}
                      syncedPriority={this.props.syncedPriority}
                    />
                  )}
                </div>
                <div className="col-md-3">
                  <DraftClock
                    draftPicks={this.props.draftPicks}
                    isMyPick={this.props.isMyDraftPick}
                    allowClock={this.props.allowClock}
                  />
                </div>
              </div>
            )
          )}
          {isDraftComplete ? null : (
            <div className="row">
              <div className="col-md-4">
                <GolfDraftPanel heading='Draft Order'>
                  <a name='InlineDraftPriorityEditor' />
                  <DraftPickOrder
                    currentUser={this.props.currentUser}
                    currentPick={this.props.currentPick}
                    pickingForPlayers={this.props.pickingForPlayers}
                    onPlayerSelected={this._onDraftHistorySelectionChange}
                  />
                </GolfDraftPanel>
              </div>
              <div className="col-md-8">
                <GolfDraftPanel heading={priorityPanelHeader}>
                  <PickListEditor
                    syncedPriority={this.props.syncedPriority}
                    pendingPriority={this.props.pendingPriority}
                    height="29em"
                  />
                </GolfDraftPanel>
              </div>
            </div>
          )}
          <div className="row">
            <div className="col-md-12">
              <ChatRoom
                currentUser={this.props.currentUser}
                messages={this.props.chatMessages}
                activeUsers={this.props.activeUsers}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <DraftHistory
                draftPicks={this.props.draftPicks}
                selectedPlayerId={this.state.draftHistoryPlayerId}
                onSelectionChange={this._onDraftHistorySelectionChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },

  _onDraftHistorySelectionChange: function (playerId) {
    this.setState({ draftHistoryPlayerId: playerId });
  }

});

module.exports = DraftApp;
