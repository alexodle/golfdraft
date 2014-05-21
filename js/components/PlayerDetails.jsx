/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactPropTypes = React.PropTypes;
var _ = require("underscore");

var PlayerStore = require('../stores/PlayerStore');
var GolferStore = require('../stores/GolferStore');

var PlayerDetails = React.createClass({

  propTypes: {
    player: ReactPropTypes.string.isRequired,
    playerScores: ReactPropTypes.object.isRequired
  },

  render: function () {
    var player = this.props.player;
    var playerScore = this.props.playerScores[player];
    var golferScores = playerScore.scoresByGolfer;

    var trs = _.map(_.values(golferScores), function (gs) {
      return (
        <tr key={gs.golfer}>
          <td>{GolferStore.getGolfer(gs.golfer).name}</td>
          <td>{gs.total}</td>
          {_.map(gs.scores, function (s, i) {
            return (<td key={i}>{s}</td>);
          })}
        </tr>
      );
    });

    return (
      <section>
        <h2>{PlayerStore.getPlayer(player).name} <small>Details</small></h2>
        <table className='table'>
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
