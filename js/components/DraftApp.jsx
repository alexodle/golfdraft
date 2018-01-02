"use strict";

var _ = require("lodash");
var AppPausedStatus = require('./AppPausedStatus.jsx');
var Assets = require("../constants/Assets");
var BestLeft = require("./BestLeft.jsx");
var ChatRoom = require("./ChatRoom.jsx");
var DraftChooser = require("./DraftChooser.jsx");
var DraftClock = require("./DraftClock.jsx");
var DraftHistory = require("./DraftHistory.jsx");
var DraftPickOrder = require("./DraftPickOrder.jsx");
var DraftStatus = require("./DraftStatus.jsx");
var GolfDraftPanel = require("./GolfDraftPanel.jsx");
var keyMirror = require('fbjs/lib/keyMirror');
var PickListEditor = require("./PickListEditor.jsx");
var React = require("react");
var SettingsActions = require("../actions/SettingsActions");

var myTurnSound = new Audio(Assets.MY_TURN_SOUND);
var pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

var DraftApp = React.createClass({

  getInitialState: function () {
    return {
      draftHistoryPlayerId: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    var props = this.props;
    if (!props.playSounds) return;

    if (!props.isMyDraftPick && nextProps.isMyDraftPick) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
      pickMadeSound.play();
    }
  },

  render: function () {
    var isMyPick = this.props.isMyDraftPick;
    var isDraftPaused = this.props.isPaused;

    var priorityPanelHeader = (
      <span>
        <span>Pick Priorities</span>
        <span className="pull-right"><em>NEW!</em></span>
      </span>
    );

    return (
      <div>
        <div>
          {isDraftPaused ? (<AppPausedStatus />) : (
            <div className="row">
              <div className="col-md-9">
                {!isMyPick ? (
                  <div>
                    <DraftStatus currentPick={this.props.currentPick} />
                    <DraftPickOrder
                      currentUser={this.props.currentUser}
                      currentPick={this.props.currentPick}
                      pickingForPlayers={this.props.pickingForPlayers}
                      onPlayerSelected={this._onDraftHistorySelectionChange}
                    />
                  </div>
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
          )}
          <div className="row">
            <div className="col-md-12">
              <GolfDraftPanel heading={priorityPanelHeader}>
                <PickListEditor
                  syncedPriority={this.props.syncedPriority}
                  pendingPriority={this.props.pendingPriority}
                  height="29em"
                />
              </GolfDraftPanel>
            </div>
          </div>
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
