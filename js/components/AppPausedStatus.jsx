'use strict';

var _ = require('lodash');
var React = require('react');

var AppPausedStatus = React.createClass({

  render: function () {
    return (
      <div className="jumbotron">
        <h1>Pause!</h1>
        <p>
          The draft is on pause while I figure some shit out. Thanks for being patient!<br />
          - Alex
        </p>
      </div>
    );
  }

});

module.exports = AppPausedStatus;
