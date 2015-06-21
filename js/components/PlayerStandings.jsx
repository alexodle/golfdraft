/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var cx = require('react/lib/cx');
var GolferStore = require('../stores/GolferStore');
var PlayerStore = require('../stores/PlayerStore');
var React = require("react");
var utils = require('../../common/utils');

var ReactPropTypes = React.PropTypes;

var PlayerStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    playerScores: ReactPropTypes.object.isRequired,
    selectedPlayer: ReactPropTypes.string.isRequired
  },

  render: function () {
    var playerScores = _.sortBy(this.props.playerScores, 'total');
    var playerTotals = _.pluck(playerScores, 'total');
    var topScore = playerTotals[0];

    var trs = _.map(playerScores, function (ps) {
      var p = PlayerStore.getPlayer(ps.player);
      var playerIsMe = this.props.currentUser.player === p.id;
      var playerIsSelected = this.props.selectedPlayer === p.id;
      var viewPlayer = _.partial(this._onPlayerSelect, p.id);

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
          <td className='hidden-xs'>{ps.total - topScore}</td>
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
              <th className='hidden-xs'>Shots Back</th>
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
