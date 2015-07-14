/** @jsx React.DOM */
'use strict';

var GolferLogic = require('../logic/GolferLogic');
var GolferStore = require('../stores/GolferStore');
var React = require('react');

var AutoPickMaker = React.createClass({

  render: function () {
    var autoPickOrder = this.props.autoPickOrder;
    var golfersRemaining = this.props.golfersRemaining;

    var currentPick = _.chain(autoPickOrder)
      .intersection(_.pluck(golfersRemaining, 'id'))
      .first()
      .value();

    return (
      <p>I would pick: {GolferLogic.renderGolfer(GolferStore.getGolfer(currentPick))}</p>
    );
  }

});

module.exports = AutoPickMaker;
