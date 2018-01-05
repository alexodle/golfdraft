"use strict";

const React = require("react");
const _ = require("lodash");

const DraftChooser = require("./DraftChooser.jsx");

const DebugFooter = React.createClass({

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
