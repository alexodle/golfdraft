import * as _ from 'lodash';
import * as cx from 'classnames';
import * as React from 'react';
import * as utils from '../../common/utils';
import GolferStore from '../stores/GolferStore';
import UserStore from '../stores/UserStore';
import {DraftPick, TourneyStandings} from '../types/ClientTypes';

export interface UserDetailsProps {
  userId: string;
  draftPicks: DraftPick[];
  tourneyStandings: TourneyStandings;
}

export default class UserDetails extends React.Component<UserDetailsProps, {}> {

  render() {
    const currentDayIndex = this.props.tourneyStandings.currentDay - 1;
    const userScores = this.props.tourneyStandings.playerScores;

    const userId = this.props.userId;
    const userScoreIndex = _.findIndex(userScores, us => us.player === userId);
    const userScore = userScores[userScoreIndex];

    const golferPickNumbers = _.chain(this.props.draftPicks)
      .map(dp => dp.golfer)
      .invert()
      .mapValues(Number)
      .value();

    const golferScores = _.chain(userScore.dayScores)
      .flatMap(ds => ds.golferScores)
      .groupBy(gs => gs.golfer)
      .toPairs()
      .sortBy(([golfer, golferScores]) => golferPickNumbers[golfer])
      .value();

    const trs = _.map(golferScores, ([golfer, golferScores], i) => {
      const golferTotal = _.sumBy(golferScores, gs => gs.score);
      return (
        <tr key={golfer}>
          <td>
            {GolferStore.getGolfer(golfer).name}
            <small> ({utils.getOrdinal(golferPickNumbers[golfer] + 1)} pick)</small>
          </td>
          <td>{utils.toGolferScoreStr(golferTotal)}</td>
          {_.map(golferScores, (gs, i) => {
            return (
              <td
                key={i}
                className={cx({
                  'missed-cut': gs.missedCut,
                  'score-used': gs.scoreUsed
                })}
              >
                {utils.toGolferScoreStr(gs.score)}
                <sup className="missed-cut-text"> MC</sup>
                {i !== currentDayIndex ? null : (
                  <sup className="thru-text"> {utils.toThruStr(gs.thru)}</sup>
                )}
              </td>
            );
          })}
        </tr>
      );
    })
    return (
      <section>
        <h2>
          {UserStore.getUser(userId).name}
          <span> </span>({utils.toGolferScoreStr(userScore.totalScore)})
          <small> {utils.getOrdinal(userScore.standing + 1)} place {userScore.isTied ? "(Tie)" : null}</small>
        </h2>
        <table className='table user-details-table'>
          <thead>
            <tr>
              <th>Golfer</th>
              <th>Score</th>
              <th>Day 1</th>
              <th>Day 2</th>
              <th>Day 3</th>
              <th>Day 4</th>
            </tr>
          </thead>
          <tbody>{trs}</tbody>
        </table>
      </section>
    );
  }

};
