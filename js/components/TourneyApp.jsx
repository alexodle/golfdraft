/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var ChatRoom = require('./ChatRoom.jsx');
var constants = require('../../common/constants');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferStore = require('../stores/GolferStore');
var LogoutButton = require('./LogoutButton.jsx');
var moment = require('moment');
var PlayerDetails = require('./PlayerDetails.jsx');
var PlayerStandings = require('./PlayerStandings.jsx');
var React = require('react');
var ScoreLogic = require('../logic/ScoreLogic');
var utils = require('../../common/utils');

var ReactPropTypes = React.PropTypes;

var NDAYS = constants.NDAYS;

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

    var scores = this.props.scores;
    var worstScoresPerDay = _.chain(NDAYS)
      .times(function (day) {
        var worstScore = _.chain(scores)
          .reject(function (s) {
            return s.missedCuts[day];
          })
          .max(function (s) {
            return s.scores[day];
          })
          .value();
        return {
          day: day,
          golfer: worstScore.golfer,
          score: worstScore.scores[day]
        };
      })
      .first(function (s) {
        // Assume 0 means they haven't started playing this day yet
        return s.score > 0;
      })
      .value();

    return (
      <section>
        <p>
          <small>
            Scores sync every 10 minutes. Last sync: <b>{moment(this.props.lastScoresUpdate).calendar()}</b>
          </small>
        </p>

        <a name='PlayerDetails' />
        <GolfDraftPanel heading='Score Details'>

          <PlayerDetails
            player={this.state.playerDetailsPlayer}
            playerScores={playerScores}
            draftPicks={this.props.draft.draftPicks}
          />
        </GolfDraftPanel>

        {!worstScoresPerDay.length ? null : (
          <GolfDraftPanel heading='Worst Scores of the Day'>
            <ul>
              {_.map(worstScoresPerDay, function (s) {
                return (
                  <li key={s.day} className='list-unstyled'>
                    <b>Day {s.day + 1}</b>: {utils.toGolferScoreStr(s.score)} {GolferStore.getGolfer(s.golfer).name}
                  </li>
                );
              })}
            </ul>
          </GolfDraftPanel>
        )}

        <GolfDraftPanel heading='Overall Standings'>
          <PlayerStandings
            currentUser={this.props.currentUser}
            playerScores={playerScores}
            selectedPlayer={this.state.playerDetailsPlayer}
            onPlayerSelect={this._onPlayerSelect}
          />
        </GolfDraftPanel>

        <ChatRoom
          messages={this.props.chatMessages}
          activeUsers={this.props.activeUsers}
        />
      </section>
    );
  },

  _onPlayerSelect: function (player) {
    this.setState({playerDetailsPlayer: player});
  }

});

module.exports = TourneyApp;
