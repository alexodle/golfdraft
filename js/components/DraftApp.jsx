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

var TABS = keyMirror({
  "DRAFT_HQ": null,
  "PICK_LIST_EDITOR": null
});

var TAB_ORDER = [TABS.DRAFT_HQ, TABS.PICK_LIST_EDITOR];

var TAB_DISPLAY_NAMES = {
  "DRAFT_HQ": "Draft HQ",
  "PICK_LIST_EDITOR": "Pick Priorities"
}

var DEFAULT_TAB = TABS.DRAFT_HQ;

var DraftApp = React.createClass({

  getInitialState: function () {
    return {
      draftHistoryPlayerId: null,
      tabSelection: DEFAULT_TAB
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
    var tabSelection = this.state.tabSelection;

    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <ul className="nav nav-tabs" style={{marginBottom: "20px"}}>
              {_.map(TAB_ORDER, function (t) {
                return (
                  <li
                    key={t}
                    role="presentation"
                    onClick={this._onTabClick.bind(this, t)}
                    className={tabSelection == t ? "active" : ""}
                  >
                    <a href="#">{TAB_DISPLAY_NAMES[t]}</a>
                  </li>
                );
              }, this)}
            </ul>
          </div>
        </div>
        {this._renderTabSubview()}
      </div>
    );
  },

  _renderTabSubview: function () {
    var tabSelection = this.state.tabSelection;
    var isMyPick = this.props.isMyDraftPick;
    var isDraftPaused = this.props.isPaused;

    if (tabSelection == TABS.DRAFT_HQ) {
      var priorityPanelHeader = (
        <span>
          <span>Pick Priorities</span>
          <span className="pull-right">
            <a href="#" onClick={this._onTabClick.bind(this, TABS.PICK_LIST_EDITOR)}>
              <span className="glyphicon glyphicon-fullscreen"/>
            </a>
          </span>
        </span>
      );
      return (
        <div>
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
              <GolfDraftPanel heading={priorityPanelHeader}>
                <PickListEditor
                  syncedPriority={this.props.syncedPriority}
                  pendingPriority={this.props.pendingPriority}
                  height="32em"
                />
              </GolfDraftPanel>
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
      );
    } else { // if (tabSelection == TABS.PICK_LIST_EDITOR) {
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <GolfDraftPanel heading="Pick Priorities">
                <PickListEditor
                  syncedPriority={this.props.syncedPriority}
                  pendingPriority={this.props.pendingPriority}
                />
              </GolfDraftPanel>
            </div>
          </div>
        </div>
      );
    }
  },

  _onPriorityEdit: function () {
    window.scrollTo(0, 0);
    this.setState({ draftHistoryPlayerId: playerId, requestAutoPriorityEdit: true });
  },

  _onDraftHistorySelectionChange: function (playerId) {
    this.setState({ draftHistoryPlayerId: playerId });
  },

  _onTabClick: function (t) {
    if (t != this.state.tabSelection) {
      this.setState({ tabSelection: t });
    }
  }

});

module.exports = DraftApp;
