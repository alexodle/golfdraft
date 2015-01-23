/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var ChatRoom = require("./ChatRoom.jsx");
var DraftAppSounds = require("./DraftAppSounds.jsx");
var DraftChooser = require("./DraftChooser.jsx");
var DraftHistory = require("./DraftHistory.jsx");
var DraftPickOrder = require("./DraftPickOrder.jsx");
var DraftStatus = require("./DraftStatus.jsx");
var GolferStore = require("../stores/GolferStore");
var IsMyDraftPickMixin = require("./IsMyDraftPickMixin");
var LogoutButton = require("./LogoutButton.jsx");
var React = require("react");
var SettingsActions = require("../actions/SettingsActions");
var SoundToggle = require("./SoundToggle.jsx");

function getGolfersRemaining(props) {
  var pickedGolfers = _.pluck(props.draftPicks, "golfer");
  var golfersRemaining = _.omit(GolferStore.getAll(), pickedGolfers);
  return golfersRemaining;
}

var DraftApp = React.createClass({
  mixins: [IsMyDraftPickMixin],

  render: function () {
    var draftView = null;
    var golfersRemaining = getGolfersRemaining(this.props);
    var isMyPick = this.isMyDraftPick();
    var isDraftOver = !this.props.currentPick;

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
            {!isMyPick ? (
              <DraftStatus currentPick={this.props.currentPick} />
            ) : (
              <DraftChooser
                golfersRemaining={golfersRemaining}
                currentPick={this.props.currentPick}
              />
            )}
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <ChatRoom messages={this.props.chatMessages} />
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
            <DraftHistory draftPicks={this.props.draftPicks} />
          </div>
        </div>

        {/* Hidden */}
        <DraftAppSounds
          currentUser={this.props.currentUser}
          currentPick={this.props.currentPick}
          draftPicks={this.props.draftPicks}
          playSounds={this.props.playSounds}
          messages={this.props.chatMessages}
        />
      </section>
    );
  }

});

module.exports = DraftApp;
