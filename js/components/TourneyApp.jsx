'use strict';

const _ = require('lodash');
const ChatRoom = require('./ChatRoom.jsx');
const constants = require('../../common/constants');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const moment = require('moment');
const PlayerDetails = require('./PlayerDetails.jsx');
const PlayerStandings = require('./PlayerStandings.jsx');
const React = require('react');
const ScoreLogic = require('../logic/ScoreLogic');
const utils = require('../../common/utils');

const ReactPropTypes = React.PropTypes;

const NDAYS = constants.NDAYS;

function getState(state, props) {
  return {
    playerDetailsPlayer: state.playerDetailsPlayer || props.currentUser.player
  };
}

const TourneyApp = React.createClass({

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
    const playerScores = ScoreLogic.calcPlayerScores(
      this.props.draft.draftPicks,
      this.props.scores
    );

    const scores = this.props.scores;
    const worstScoresPerDay = _.chain(NDAYS)
      .times(function (day) {
        const worstScore = _.chain(scores)
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
                    <b>Day {s.day + 1}</b>: {utils.toGolferScoreStr(s.score)}
                    <span> </span>
                    {GolferLogic.renderGolfer(GolferStore.getGolfer(s.golfer))}
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
          currentUser={this.props.currentUser}
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
