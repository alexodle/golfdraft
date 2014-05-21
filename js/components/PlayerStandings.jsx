/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactPropTypes = React.PropTypes;
var _ = require("underscore");

var PlayerStore = require('../stores/PlayerStore');
var GolferStore = require('../stores/GolferStore');
var utils = require('../utils');

var PlayerStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    playerScores: ReactPropTypes.object.isRequired
  },

  render: function () {
    var playerScores = _.chain(this.props.playerScores)
      .values()
      .sortBy(function (ps) { return ps.total; })
      .value();
    var topScore = playerScores[0].total;

    var trs = _.map(playerScores, function (ps, i) {
      var p = PlayerStore.getPlayer(ps.player);
      var playerIsMe = this.props.currentUser.player === p.id;

      return (
        <tr key={p.id}>
          <td>{i + 1}</td>
          <td>
            <a
              href="#noop"
              onClick={_.partial(this.props.onPlayerSelect, p.id)}
            >
              {playerIsMe ? (<b>{p.name}</b>) : p.name}
            </a>
          </td>
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
        <table className='table'>
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
