/** @jsx React.DOM */
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var _ = require('underscore');
var moment = require('moment');

var ScoreLogic = require('../logic/ScoreLogic');

var LogoutButton = require('./LogoutButton.jsx');
var PlayerStandings = require('./PlayerStandings.jsx');
var PlayerDetails = require('./PlayerDetails.jsx');

function getState(state, props) {
  return {
    playerDetailsPlayer: state.playerDetailsPlayer || props.currentUser.player
  };
}

var TourneyApp = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    scores: ReactPropTypes.object.isRequired,
    draft: ReactPropTypes.object.isRequired
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
        <div className="page-header">
          <h1>Welcome to the 2014 U.S. Open <small>
            {this.props.currentUser.name}</small>
          </h1>
          <div className="logout-row">
            <LogoutButton currentUser={this.props.currentUser} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <small>
              Scores sync every 10 minutes. Last sync: <b>{moment(this.props.lastScoresUpdate).calendar()}</b>
            </small>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <PlayerDetails
              player={this.state.playerDetailsPlayer}
              playerScores={playerScores}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <PlayerStandings
              currentUser={this.props.currentUser}
              playerScores={playerScores}
              selectedPlayer={this.state.playerDetailsPlayer}
              onPlayerSelect={this._onPlayerSelect}
            />
          </div>
        </div>
      </section>
    );
  },

  _onPlayerSelect: function (player) {
    this.setState({playerDetailsPlayer: player});
  }

});

module.exports = TourneyApp;
