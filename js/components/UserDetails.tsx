import * as _ from 'lodash';
import * as cx from 'classnames';
import * as React from 'react';
import * as utils from '../../common/utils';
import GolferStore from '../stores/GolferStore';
import UserStore from '../stores/UserStore';
import {User, DraftPick, UserScore, IndexedUserScores} from '../types/ClientTypes';

export interface UserDetailsProps {
  userId: string;
  draftPicks: DraftPick[];
  userScores: IndexedUserScores;
}

export default class UserDetails extends React.Component<UserDetailsProps, {}> {

  render() {
    const userId = this.props.userId;
    const userScore = this.props.userScores[userId];
    const scoresByDay = userScore.scoresByDay;
    const draftPicksByGolfer = _.keyBy(this.props.draftPicks, 'golfer');

    const sortedScores = _.chain(this.props.userScores)
      .map("total")
      .sortBy()
      .value();
    const userRank = _.sortedIndex(sortedScores, userScore.total);
    const isTied = sortedScores[userRank + 1] === userScore.total;

    const golferScores = _.sortBy(userScore.scoresByGolfer, 'total');
    const trs = _.map(golferScores, function (gs) {
      return (
        <tr key={gs.golfer}>
          <td>
            {GolferStore.getGolfer(gs.golfer).name}
            <small> ({utils.getOrdinal(draftPicksByGolfer[gs.golfer].pickNumber + 1)} pick)</small>
          </td>
          <td>{utils.toGolferScoreStr(gs.total)}</td>
          {_.map(gs.scores, function (s, i) {
            const missedCut = gs.missedCuts[i];
            const scoreUsed = _.chain(scoresByDay[i].usedScores)
              .map('golfer')
              .includes(gs.golfer)
              .value();
            const currentDay = gs.day === i + 1;
            return (
              <td
                className={cx({
                  'missed-cut': missedCut,
                  'score-used': scoreUsed
                })}
                key={i}
              >
                {utils.toGolferScoreStr(s)}
                <sup className="missed-cut-text"> MC</sup>
                {!currentDay ? null : (
                  <sup className="thru-text"> {utils.toThruStr(gs.thru)}</sup>
                )}
              </td>
            );
          })}
        </tr>
      );
    });

    const tieText = isTied ? "(Tie)" : "";
    return (
      <section>
        <h2>
          {UserStore.getUser(userId).name}
          <span> </span>({utils.toGolferScoreStr(userScore.total)})
          <small> {utils.getOrdinal(userRank + 1)} place {tieText}</small>
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
