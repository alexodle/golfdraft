/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("lodash");

var DraftChooser = require("./DraftChooser.jsx");

var DebugFooter = React.createClass({

  render: function () {
    return (
      <div className="page-footer">
        <h2>DEBUG DEBUG DEBUG DEBUG</h2>
        <DraftChooser
          golfersRemaining={this.props.golfersRemaining}
          currentPick={this.props.currentPick}
        />
      </div>
    );
  }

});

module.exports = DebugFooter;
