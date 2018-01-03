"use strict";

const _ = require("lodash");
const cx = require('classnames');
const GolferStore = require('../stores/GolferStore');
const PlayerStore = require('../stores/PlayerStore');
const React = require("react");
const utils = require('../../common/utils');

const ReactPropTypes = React.PropTypes;

const PlayerStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    playerScores: ReactPropTypes.object.isRequired,
    selectedPlayer: ReactPropTypes.string.isRequired
  },

  render: function () {
    const playerScores = _.sortBy(this.props.playerScores, 'total');
    const playerTotals = _.pluck(playerScores, 'total');
    const topScore = playerTotals[0];

    const trs = _.map(playerScores, function (ps) {
      const p = PlayerStore.getPlayer(ps.player);
      const playerIsMe = this.props.currentUser.player === p.id;
      const playerIsSelected = this.props.selectedPlayer === p.id;
      const viewPlayer = _.partial(this._onPlayerSelect, p.id);
      const holesLeft = _.sum(ps.scoresByGolfer, function (gs) {
        if (_.any(gs.missedCuts)) {
          return 0;
        } else if (gs.thru === null) {
          return 18;
        } else {
          return 18 - gs.thru;
        }
      });

      return (
        <tr
          key={p.id}
          className={cx({
            'selected-player-row': playerIsSelected
          })}
          onClick={viewPlayer}
        >
          <td>{_.sortedIndex(playerTotals, ps.total) + 1}</td>
          <td>{playerIsMe ? (<b>{p.name}</b>) : p.name}</td>
          <td>{utils.toGolferScoreStr(ps.total)}</td>
          <td>{ps.pickNumber + 1}</td>
          <td className='hidden-xs'>{holesLeft > 0 ? holesLeft : 'F'}</td>
          {_.map(ps.scoresByDay, function (ds) {
            return (<td className='hidden-xs' key={ds.day}>{utils.toGolferScoreStr(ds.total)}</td>);
          })}
          <td className='visible-xs'><a href='#PlayerDetails' onClick={viewPlayer}>Details</a></td>
        </tr>
      );
    }, this);

    return (
      <section>
        <p>
          <small>
            <b>Tip:</b> Click on a player row to view score details (above)
          </small>
        </p>
        <table className='table standings-table table-hover'>
          <thead>
            <tr>
              <th>#</th>
              <th>Pool Player</th>
              <th>Total</th>
              <th>Pick Number</th>
              <th className='hidden-xs'>Holes Left Today</th>
              <th className='hidden-xs'>Day 1</th>
              <th className='hidden-xs'>Day 2</th>
              <th className='hidden-xs'>Day 3</th>
              <th className='hidden-xs'>Day 4</th>
              <th className='visible-xs'></th>
            </tr>
          </thead>
          <tbody>{trs}</tbody>
        </table>
      </section>
    );
  },

  _onPlayerSelect: function (pid) {
    this.props.onPlayerSelect(pid);
  }

});

module.exports = PlayerStandings;
