'use strict';

const React = require('react');

class GolfDraftPanel extends React.Component {
  render() {
    return (
      <div
        className='panel panel-default golfdraft-panel'
        style={{height: this.props.height || "100%"}}
      >
        {!this.props.heading ? null : (
          <div className='panel-heading'>
            <h3 className='panel-title'>{this.props.heading}</h3>
          </div>
        )}
        <div className='panel-body'>
          {this.props.children}
        </div>
      </div>
    );
  }

};

module.exports = GolfDraftPanel;
