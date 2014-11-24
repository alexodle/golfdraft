/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactPropTypes = React.PropTypes;
var cx = require('react/lib/cx');
var _ = require("lodash");

var PlayerStore = require('../stores/PlayerStore');
var GolferStore = require('../stores/GolferStore');
var utils = require('../utils');

var PlayerStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    playerScores: ReactPropTypes.object.isRequired,
    selectedPlayer: ReactPropTypes.string.isRequired
  },

  render: function () {
    var playerScores = _.chain(this.props.playerScores)
      .values()
      .sortBy(function (ps) { return ps.total; })
      .value();
    var playerTotals = _.pluck(playerScores, "total");
    var topScore = playerTotals[0];

    var trs = _.map(playerScores, function (ps, i) {
      var p = PlayerStore.getPlayer(ps.player);
      var playerIsMe = this.props.currentUser.player === p.id;
      var playerIsSelected = this.props.selectedPlayer === p.id;

      return (
        <tr
          key={p.id}
          className={cx({
            'selected-player-row': playerIsSelected
          })}
          onClick={_.partial(this.props.onPlayerSelect, p.id)}
        >
          <td>{_.sortedIndex(playerTotals, ps.total) + 1}</td>
          <td>{playerIsMe ? (<b>{p.name}</b>) : p.name}</td>
          <td>{ps.total}</td>
          <td>{ps.total - topScore}</td>
          {_.map(ps.scoresByDay, function (ds) {
            return (<td key={ds.day}>{ds.total}</td>);
          })}
        </tr>
      );
    }, this);

    return (
      <section>
        <h2>Pool player standings</h2>
        <table className='table standings-table table-hover'>
          <thead>
            <tr>
              <th>#</th>
              <th>Pool Player</th>
              <th>Total</th>
              <th>Behind</th>
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

module.exports = PlayerStandings;
