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
var GolferStore = require("../stores/GolferStore");
var React = require("react");
var SettingsActions = require("../actions/SettingsActions");

var myTurnSound = new Audio(Assets.MY_TURN_SOUND);
var pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

var DraftApp = React.createClass({

  getInitialState: function () {
    return { draftHistoryPlayerId: null };
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
    var draftView = null;
    var isMyPick = this.props.isMyDraftPick;
    var isDraftOver = !this.props.currentPick;
    var isDraftPaused = this.props.isPaused;

    return (
      <section>
        {isDraftPaused ? (<AppPausedStatus />) : (
          <div className="row">
            <div className="col-md-9">
              {!isMyPick ? (
                <DraftStatus currentPick={this.props.currentPick} />
              ) : (
                <DraftChooser
                  currentUser={this.props.currentUser}
                  golfersRemaining={this.props.golfersRemaining}
                  currentPick={this.props.currentPick}
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
            <ChatRoom
              currentUser={this.props.currentUser}
              messages={this.props.chatMessages}
              activeUsers={this.props.activeUsers}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <DraftPickOrder
              currentUser={this.props.currentUser}
              currentPick={this.props.currentPick}
              pickingForPlayers={this.props.pickingForPlayers}
              onPlayerSelected={this._onDraftHistorySelectionChange}
            />
          </div>
          <div className="col-md-6">
            <BestLeft golfersRemaining={this.props.golfersRemaining} />
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
      </section>
    );
  },

  _onDraftHistorySelectionChange: function (playerId) {
    this.setState({ draftHistoryPlayerId: playerId });
  }

});

module.exports = DraftApp;
