/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var ChatRoom = require('./ChatRoom.jsx');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var LogoutButton = require('./LogoutButton.jsx');
var moment = require('moment');
var PlayerDetails = require('./PlayerDetails.jsx');
var PlayerStandings = require('./PlayerStandings.jsx');
var React = require('react');
var ScoreLogic = require('../logic/ScoreLogic');

var ReactPropTypes = React.PropTypes;

function getState(state, props) {
  return {
    playerDetailsPlayer: state.playerDetailsPlayer || props.currentUser.player
  };
}

var TourneyApp = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    scores: ReactPropTypes.object.isRequired,
    draft: ReactPropTypes.object.isRequired,
    chatMessages: ReactPropTypes.array
  },

  getInitialState: function () {
    return getState({}, this.props);
  },

  render: function () {
    var playerScores = ScoreLogic.calcPlayerScores(
      this.props.draft.draftPicks,
      this.props.scores
    );

    return (
      <section>

        <GolfDraftPanel heading='Score Details'>
          <small>
            Scores sync every 10 minutes. Last sync: <b>{moment(this.props.lastScoresUpdate).calendar()}</b>
          </small>
          <PlayerDetails
            player={this.state.playerDetailsPlayer}
            playerScores={playerScores}
            draftPicks={this.props.draft.draftPicks}
          />
        </GolfDraftPanel>

        <GolfDraftPanel heading='Overall Standings'>
            <PlayerStandings
              currentUser={this.props.currentUser}
              playerScores={playerScores}
              selectedPlayer={this.state.playerDetailsPlayer}
              onPlayerSelect={this._onPlayerSelect}
            />
        </GolfDraftPanel>

        <ChatRoom messages={this.props.chatMessages} />
      </section>
    );
  },

  _onPlayerSelect: function (player) {
    this.setState({playerDetailsPlayer: player});
  }

});

module.exports = TourneyApp;
