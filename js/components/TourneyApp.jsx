'use strict';

var _ = require('lodash');
var ChatRoom = require('./ChatRoom.jsx');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferLogic = require('../logic/GolferLogic');
var GolferStore = require('../stores/GolferStore');
var moment = require('moment');
var PlayerDetails = require('./PlayerDetails.jsx');
var PlayerStandings = require('./PlayerStandings.jsx');
var React = require('react');
var ScoreLogic = require('../logic/ScoreLogic');
var utils = require('../../common/utils');

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

    var scores = this.props.scores;
    var worstScoresPerDay = ScoreLogic.worstScoresPerDay(scores);

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
