import * as moment from 'moment';
import * as React from 'react';
import ChatRoom from './ChatRoom';
import GolfDraftPanel from './GolfDraftPanel';
import GolferLogic from '../logic/GolferLogic';
import GolferStore from '../stores/GolferStore';
import UserDetails from './UserDetails';
import UserStandings from './UserStandings';
import * as utils from '../../common/utils';
import { DraftProps } from '../types/SharedProps';
import { User, TourneyStandings, ChatMessage, Indexed } from '../types/ClientTypes';

export interface TourneyAppProps {
  draft: DraftProps;
  currentUser: User;
  tourneyStandings: TourneyStandings;
  lastScoresUpdate: Date;
  chatMessages?: ChatMessage[];
  activeUsers: Indexed<string>;
  isViewingActiveTourney: boolean;
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

  private _getInitialState() {
    return getState({} as TourneyAppState, this.props);
  }

  private renderCalculatingStandings() {
    return (<p>Initializing tourney...</p>);
  }

  render() {
    if (!this.props.tourneyStandings) {
      return this.renderCalculatingStandings();
    }

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
            pickOrder={this.props.draft.pickOrder}
            tourneyStandings={this.props.tourneyStandings}
            selectedUser={this.state.userDetailsUser}
            onUserSelect={this._onUserSelect}
          />
        </GolfDraftPanel>

        <a id='UserDetails' />
        <GolfDraftPanel heading='Score Details'>
          <UserDetails
            userId={this.state.userDetailsUser}
            tourneyStandings={this.props.tourneyStandings}
            draftPicks={this.props.draft.draftPicks}
          />
        </GolfDraftPanel>

        {!this.props.tourneyStandings.worstScoresForDay.length ? null : (
          <GolfDraftPanel heading='Worst Scores of the Day'>
            <ul className='list-unstyled'>
              {this.props.tourneyStandings.worstScoresForDay.map(s => (
                <li key={s.day}>
                  <b>Day {s.day + 1}</b>: {utils.toGolferScoreStr(s.score)}
                  <span> </span>
                  {GolferLogic.renderGolfer(GolferStore.getGolfer(s.golfer))}
                </li>
              ))}
            </ul>
          </GolfDraftPanel>
        )}

        <ChatRoom
          currentUser={this.props.currentUser}
          messages={this.props.chatMessages}
          activeUsers={this.props.activeUsers}
          enabled={this.props.isViewingActiveTourney}
        />
      </section>
    );
  }

  _onUserSelect = (userId: string) => {
    window.location.href = '#UserDetails';
    this.setState({ userDetailsUser: userId });
  }

};

export default TourneyApp;
