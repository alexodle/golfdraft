// @flow
'use strict';

const React = require("react");
const ReactPropTypes = React.PropTypes;
const cx = require('classnames');
const _ = require("lodash");
const utils = require("../../common/utils");

const UserStore = require('../stores/UserStore');
const GolferStore = require('../stores/GolferStore');

const UserDetails = React.createClass({

  propTypes: {
    user: ReactPropTypes.string.isRequired,
    userScores: ReactPropTypes.object.isRequired
  },

  render: function () {
    const user = this.props.user;
    const userScore = this.props.userScores[user];
    const scoresByDay = userScore.scoresByDay;
    const draftPicksByGolfer = _.indexBy(this.props.draftPicks, 'golfer');

    const sortedScores = _.chain(this.props.userScores)
      .pluck("total")
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
              .pluck('golfer')
              .contains(gs.golfer)
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
          {UserStore.getUser(user).name}
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

});

module.exports = UserDetails;
