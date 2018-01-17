'use strict';

const React = require("react");
const _ = require("lodash");

const DraftChooser = require("./DraftChooser.jsx");

class DebugFooter extends React.Component {
  render() {
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

};

module.exports = DebugFooter;
