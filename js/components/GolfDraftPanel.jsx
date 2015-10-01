"use strict";

var React = require('react');

var GolfDraftPanel = React.createClass({

  render: function () {
    return (
      <div className='panel panel-default'>
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

});

module.exports = GolfDraftPanel;
