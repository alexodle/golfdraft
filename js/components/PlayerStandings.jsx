/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactPropTypes = React.PropTypes;
var _ = require("underscore");

var PlayerStore = require('../stores/PlayerStore');
var GolferStore = require('../stores/GolferStore');

function transpose(a) {
  if (!a.length) {
    return a;
  }
  return Object.keys(a[0]).map(function (c) {
    return a.map(function (r) { return r[c]; });
  });
}

function playerScore(golferScores) {
  var dayScores = _.map(transpose(golferScores), function (dayScores) {
    var sorted = _.sortBy(dayScores);
    return sorted[0] + sorted[1];
  });
  return {
    dayScores: dayScores,
    total: _.reduce(dayScores, function (n, ds) { return n + ds; }, 0)
  }
}

var PlayerStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    golfersByPlayer: ReactPropTypes.object.isRequired,
    scores: ReactPropTypes.object.isRequired
  },

  render: function () {
    var scores = this.props.scores;
    var players = PlayerStore.getAll();
    var golfersByPlayer = this.props.golfersByPlayer;

    var playerScores = _.chain(players)
      .map(function (p) {
        var golferScores = _.map(golfersByPlayer[p.id], function (g) {
          return scores[g].scores;
        });
        return {
          player: p,
          score: playerScore(golferScores)
        };
      })
      .sortBy(function (ps) { return ps.score.total; })
      .value();
    var topScore = playerScores[0].score.total;

    var trs = _.map(playerScores, function (ps, i) {
      var p = ps.player;
      var golfers = golfersByPlayer[p.id];
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
          <td>{ps.score.total}</td>
          <td>{topScore - ps.score.total}</td>
          {_.map(ps.score.dayScores, function (ds, i) {
            return (<td key={i}>{ds}</td>);
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
