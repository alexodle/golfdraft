"use strict";

const React = require("react");
const ReactPropTypes = React.PropTypes;
const cx = require('classnames');
const _ = require("lodash");
const utils = require("../../common/utils");

const PlayerStore = require('../stores/PlayerStore');
const GolferStore = require('../stores/GolferStore');

const PlayerDetails = React.createClass({

  propTypes: {
    player: ReactPropTypes.string.isRequired,
    playerScores: ReactPropTypes.object.isRequired
  },

  render: function () {
    const player = this.props.player;
    const playerScore = this.props.playerScores[player];
    const scoresByDay = playerScore.scoresByDay;
    const draftPicksByGolfer = _.indexBy(this.props.draftPicks, 'golfer');

    const sortedScores = _.chain(this.props.playerScores)
      .pluck("total")
      .sortBy()
      .value();
    const playerRank = _.sortedIndex(sortedScores, playerScore.total);
    const isTied = sortedScores[playerRank + 1] === playerScore.total;

    const golferScores = _.sortBy(playerScore.scoresByGolfer, 'total');
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
          {PlayerStore.getPlayer(player).name}
          <span> </span>({utils.toGolferScoreStr(playerScore.total)})
          <small> {utils.getOrdinal(playerRank + 1)} place {tieText}</small>
        </h2>
        <table className='table player-details-table'>
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

module.exports = PlayerDetails;
