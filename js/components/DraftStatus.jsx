/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var Link = require('react-router').Link;
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');

var DraftStatus = React.createClass({

  render: function () {
    var currentPick = this.props.currentPick;
    if (!currentPick) {
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-success" role="alert">
              The draft is over! <Link to='tourney'>
                Click here to check out live scoring
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <span>
        Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{PlayerStore.getPlayer(currentPick.player).name}</b>
      </span>
    );
  }

});

module.exports = DraftStatus;
