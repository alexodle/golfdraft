'use strict';

import * as React from 'react';
import * as _ from 'lodash';

import DraftChooser from './DraftChooser';

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

export default DebugFooter;
