import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import ChatRoom from './ChatRoom';
import * as constants from '../../common/constants';
import GolfDraftPanel from './GolfDraftPanel';
import GolferLogic from '../logic/GolferLogic';
import GolferStore from '../stores/GolferStore';
import ScoreLogic from '../logic/ScoreLogic';
import UserDetails from './UserDetails';
import UserStandings from './UserStandings';
import * as utils from '../../common/utils';
import {DraftProps} from '../types/SharedProps';
import {User, IndexedGolferScores, ChatMessage, Indexed} from '../types/Types';

const NDAYS = constants.NDAYS;

export interface TourneyAppProps {
  draft: DraftProps;
  currentUser: User;
  scores: IndexedGolferScores;
  lastScoresUpdate: Date;
  chatMessages?: ChatMessage[];
  activeUsers: Indexed<number>;
}

interface TourneyAppState {
  userDetailsUser: string;
}

function getState(state: TourneyAppState, props: TourneyAppProps) {
  return {
    userDetailsUser: state.userDetailsUser || props.currentUser._id
  };
}

class TourneyApp extends React.Component<TourneyAppProps, TourneyAppState> {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return getState({} as TourneyAppState, this.props);
  }

  render() {
    const userScores = ScoreLogic.calcUserScores(
      this.props.draft.draftPicks,
      this.props.scores
    );

    const scores = this.props.scores;

    const worstScoresPerDay = _.chain(NDAYS)
      .times((day) => {
        const worstScore = _.chain(scores)
          .reject((s) => s.missedCuts[day])
          .maxBy((s) => s.scores[day])
          .value();

        return {
          day: day,
          golfer: worstScore.golfer,
          score: worstScore.scores[day]
        };
      })
      .takeWhile(function (s) {
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

        <a id='UserDetails' />
        <GolfDraftPanel heading='Score Details'>

          <UserDetails
            userId={this.state.userDetailsUser}
            userScores={userScores}
            draftPicks={this.props.draft.draftPicks}
          />
        </GolfDraftPanel>

        {!worstScoresPerDay.length ? null : (
          <GolfDraftPanel heading='Worst Scores of the Day'>
            <ul>
              {_.map(worstScoresPerDay, (s) => {
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

  _onUserSelect = (userId: string) => {
    window.location.href = '#UserDetails';
    this.setState({userDetailsUser: userId});
  }

};

export default TourneyApp;
