/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var AppPausedStatus = require('./AppPausedStatus.jsx');
var Assets = require("../constants/Assets");
var AutoPickEditor = require("./AutoPickEditor.jsx");
var AutoPickMaker = require("./AutoPickMaker.jsx");
var BestLeft = require("./BestLeft.jsx");
var ChatRoom = require("./ChatRoom.jsx");
var DraftChooser = require("./DraftChooser.jsx");
var DraftHistory = require("./DraftHistory.jsx");
var DraftPickOrder = require("./DraftPickOrder.jsx");
var DraftStatus = require("./DraftStatus.jsx");
var GolferStore = require("../stores/GolferStore");
var LogoutButton = require("./LogoutButton.jsx");
var React = require("react");
var SettingsActions = require("../actions/SettingsActions");
var SoundToggle = require("./SoundToggle.jsx");

var myTurnSound = new Audio(Assets.MY_TURN_SOUND);
var pickMadeSound = new Audio(Assets.PICK_MADE_SOUND);

var DraftApp = React.createClass({

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
    var currentUser = this.props.currentUser;
    var currentPick = this.props.currentPick;

    var isDraftOver = !currentPick;
    var isDraftPaused = this.props.isPaused;

    var showChooser = this.props.isMyDraftPick;
    var isPickForMyself = showChooser && currentPick.player === currentUser.player;

    var statusUi = null;
    if (isDraftPaused) {
      statusUi = (<AppPausedStatus />);
    } else {
      if (!showChooser) {
        statusUi = (
          <span>
            <DraftStatus currentPick={currentPick} />
            <AutoPickEditor
              golfersRemaining={this.props.golfersRemaining}
              autoPickOrder={this.props.autoPickOrder}
              isAutoPick={this.props.isAutoPick}
            />
          </span>
        );
      } else if (isPickForMyself && this.props.isAutoPick) {
        statusUi = (
          <AutoPickMaker
            golfersRemaining={this.props.golfersRemaining}
            autoPickOrder={this.props.autoPickOrder}
          />
        );
      } else {
        statusUi = (
          <DraftChooser
            currentUser={this.props.currentUser}
            golfersRemaining={this.props.golfersRemaining}
            currentPick={currentPick}
          />
        );
      }
    }

    return (
      <section>
        <div className="row">
          <div className="col-md-12">
            {statusUi}
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <ChatRoom
              messages={this.props.chatMessages}
              activeUsers={this.props.activeUsers}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <DraftPickOrder
              currentUser={this.props.currentUser}
              currentPick={currentPick}
              pickingForPlayers={this.props.pickingForPlayers}
            />
          </div>
          <div className="col-md-6">
            <BestLeft golfersRemaining={this.props.golfersRemaining} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <DraftHistory draftPicks={this.props.draftPicks} />
          </div>
        </div>
      </section>
    );
  }

});

module.exports = DraftApp;
