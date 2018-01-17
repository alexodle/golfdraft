'use strict';

const _ = require('lodash');
const ChatRoom = require('./ChatRoom.jsx');
const constants = require('../../common/constants');
import GolfDraftPanel from './GolfDraftPanel';
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const moment = require('moment');
const UserDetails = require('./UserDetails.jsx');
const UserStandings = require('./UserStandings.jsx');
const React = require('react');
const ScoreLogic = require('../logic/ScoreLogic');
const utils = require('../../common/utils');

const ReactPropTypes = React.PropTypes;

const NDAYS = constants.NDAYS;

function getState(state, props) {
  return {
    userDetailsUser: state.userDetailsUser || props.currentUser._id
  };
}

class TourneyApp extends React.Component {
  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    scores: ReactPropTypes.object.isRequired,
    draft: ReactPropTypes.object.isRequired,
    chatMessages: ReactPropTypes.array
  }

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return getState({}, this.props);
  }

  render() {
    const userScores = ScoreLogic.calcUserScores(
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

        <GolfDraftPanel heading='Overall Standings'>
          <UserStandings
            currentUser={this.props.currentUser}
            userScores={userScores}
            selectedUser={this.state.userDetailsUser}
            onUserSelect={this._onUserSelect}
          />
        </GolfDraftPanel>

        <a name='UserDetails' />
        <GolfDraftPanel heading='Score Details'>

          <UserDetails
            user={this.state.userDetailsUser}
            userScores={userScores}
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

        <ChatRoom
          currentUser={this.props.currentUser}
          messages={this.props.chatMessages}
          activeUsers={this.props.activeUsers}
        />
      </section>
    );
  }

  _onUserSelect = (user) => {
    window.location.href = '#UserDetails';
    this.setState({userDetailsUser: user});
  }

};

module.exports = TourneyApp;
