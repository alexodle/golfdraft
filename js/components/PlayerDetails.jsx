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
    scores: ReactPropTypes.object.isRequired,
    golfersByPlayer: ReactPropTypes.object.isRequired
  },

  render: function () {
    var player = this.props.player;
    var scores = _.chain(this.props.golfersByPlayer[player])
      .map(function (g) {
        var gscores = this.props.scores[g];
        return {
          golfer: g,
          scores: gscores.scores,
          total: _.reduce(gscores.scores, function (n, s) { return n + s; }, 0)
        };
      }, this)
      .sortBy(function (s) { return s.total; })
      .value();

    var trs = _.map(scores, function (gs) {
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
        <h2>Details <small>{PlayerStore.getPlayer(player).name}</small></h2>
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
