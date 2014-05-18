/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var GolferStore = require("../stores/GolferStore");

var DraftChooser = require("./DraftChooser.jsx");
var DraftHistory = require("./DraftHistory.jsx");
var DraftStatus = require("./DraftStatus.jsx");
var DraftPickOrder = require("./DraftPickOrder.jsx");
var LogoutButton = require("./LogoutButton.jsx")

var myTurnSound = new Audio("/assets/boxing_bell_multiple.wav");
var pickMadeSound = new Audio("/assets/boxing_bell.wav");

function getGolfersRemaining(props) {
  var pickedGolfers = _.pluck(props.draftPicks, "golfer");
  var golfersRemaining = _.omit(GolferStore.getAll(), pickedGolfers);
  return golfersRemaining;
}

function isMyDraftPick(props) {
  return (
    props.currentUser && props.currentPick.player == props.currentUser.player
  );
}

var DraftApp = React.createClass({

  componentWillReceiveProps: function (nextProps) {
    var props = this.props;
    if (!isMyDraftPick(props) && isMyDraftPick(nextProps)) {
      myTurnSound.play();
    } else if (props.draftPicks.length + 1 == nextProps.draftPicks.length) {
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
        <div className="page-header">
          <h1>Welcome to the 2014 Masters Draft <small>
            {this.props.currentUser.name}</small>
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
              pickNumber={this.props.currentPick.pickNumber}
            />
          </div>
          <div className="col-md-9">
            <DraftHistory
              draftPicks={this.props.draftPicks}
            />
          </div>
        </div>
      </section>
    );
  }

});

module.exports = DraftApp;
