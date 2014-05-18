/** @jsx React.DOM */
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var _ = require('underscore');
var moment = require('moment');

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
    var golfersByPlayer = this._getGolfersByPlayer();
    return (
      <section>
        <div className="page-header">
          <h1>Welcome to the 2014 Masters <small>
            {this.props.currentUser.name}</small>
          </h1>
          <div className="logout-row">
            <LogoutButton currentUser={this.props.currentUser} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <small>
              Scores sync every 5 minutes. Last sync: <b>{moment(this.props.lastScoresUpdate).calendar()}</b>
            </small>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <PlayerStandings
              currentUser={this.props.currentUser}
              golfersByPlayer={golfersByPlayer}
              scores={this.props.scores}
              onPlayerSelect={this._onPlayerSelect}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <PlayerDetails
              player={this.state.playerDetailsPlayer}
              golfersByPlayer={golfersByPlayer}
              scores={this.props.scores}
            />
          </div>
        </div>
      </section>
    );
  },

  _onPlayerSelect: function (player) {
    this.setState({playerDetailsPlayer: player});
  },

  _getGolfersByPlayer: function () {
    return _.chain(this.props.draft.draftPicks)
      .groupBy(function (pick) { return pick.player; })
      .map(function (picks, playerId) {
        return [playerId, _.map(picks, function (pick) {
          return pick.golfer;
        })];
      })
      .object()
      .value();
  }

});

module.exports = TourneyApp;
