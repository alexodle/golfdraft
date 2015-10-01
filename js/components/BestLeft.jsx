'use strict';

var _ = require('lodash');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferLogic = require('../logic/GolferLogic');
var React = require('react');

var SHOW_N = 20;

var BestLeft = React.createClass({

  render: function () {
    var golfersRemaining = _.chain(this.props.golfersRemaining)
      .sortBy('wgr')
      .first(SHOW_N)
      .value();
    return (
      <GolfDraftPanel heading='Golfers Available'>
        <ol>
          {_.map(golfersRemaining, function (g) {
            return (<li key={g.id}>{GolferLogic.renderGolfer(g)}</li>);
          })}
        </ol>
      </GolfDraftPanel>
    );
  }

});

module.exports = BestLeft;
