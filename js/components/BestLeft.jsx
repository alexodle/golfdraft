'use strict';

const _ = require('lodash');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const GolferLogic = require('../logic/GolferLogic');
const React = require('react');

const SHOW_N = 20;

const BestLeft = React.createClass({

  render: function () {
    const golfersRemaining = _.chain(this.props.golfersRemaining)
      .sortBy('wgr')
      .first(SHOW_N)
      .value();
    return (
      <GolfDraftPanel heading='Golfers Available'>
        <ol>
          {_.map(golfersRemaining, function (g) {
            return (<li key={g._id}>{GolferLogic.renderGolfer(g)}</li>);
          })}
        </ol>
      </GolfDraftPanel>
    );
  }

});

module.exports = BestLeft;
