/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
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

var myTurnSound = new Audio("/assets/airplane_chime.wav");
var pickMadeSound = new Audio("/assets/bleep1.wav");

function getGolfersRemaining(props) {
  var pickedGolfers = _.pluck(props.draftPicks, "golfer");
  var golfersRemaining = _.omit(GolferStore.getAll(), pickedGolfers);
  return golfersRemaining;
}

function isMyDraftPick(props) {
  return (
    props.currentUser && props.currentPick.player === props.currentUser.player
  );
}

var DraftApp = React.createClass({

  componentWillReceiveProps: function (nextProps) {
    var props = this.props;
    if (!props.playSounds) return;

    if (!isMyDraftPick(props) && isMyDraftPick(nextProps)) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
      pickMadeSound.play();
    }
  },

  render: function () {
    var draftView = null;
    var golfersRemaining = getGolfersRemaining(this.props);

    if (isMyDraftPick(this.props)) {
      draftView = (
        <DraftChooser
          golfersRemaining={golfersRemaining}
          currentPick={this.props.currentPick}
        />
      );
    }

    return (
      <section>
        <div className="page-header draft-page-header">
          <h1>Welcome to the 2014 U.S. Open Draft
            <span> </span><small>{this.props.currentUser.name}</small>
            <SoundToggle
              className="global-sound-toggle"
              playSounds={this.props.playSounds}
            />
          </h1>

          <div className="logout-row">
            <LogoutButton currentUser={this.props.currentUser} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <DraftStatus currentPick={this.props.currentPick} />
            {draftView}
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <DraftPickOrder
              currentUser={this.props.currentUser}
              currentPick={this.props.currentPick}
            />
          </div>
          <div className="col-md-9">
            <DraftHistory
              draftPicks={this.props.draftPicks}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <ChatRoom messages={this.props.chatMessages} />
          </div>
        </div>
      </section>
    );
  }

});

module.exports = DraftApp;
