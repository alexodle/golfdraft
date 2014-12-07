/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var DraftStore = require('../stores/DraftStore');
var GolferStore = require('../stores/GolferStore');
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');
var ReactCSSTransitionGroup = require('react/lib/ReactCSSTransitionGroup');

var DraftHistory = React.createClass({

  render: function () {
    var draftPicks = _.clone(this.props.draftPicks).reverse();
    return (
      <div>
        <h2>Draft history</h2>
        <table className='table'>
          <thead><tr><th>#</th><th>Pool Player</th><th>Golfer</th></tr></thead>
          <ReactCSSTransitionGroup transitionName="tablerow" component="tbody">
            {_.map(draftPicks, function (p) {
              return (
                <tr key={p.pickNumber}>
                  <td>{p.pickNumber + 1}</td>
                  <td>{PlayerStore.getPlayer(p.player).name}</td>
                  <td>{GolferStore.getGolfer(p.golfer).name}</td>
                </tr>
              );
            })}
          </ReactCSSTransitionGroup>
        </table>
      </div>
    );
  }

});

module.exports = DraftHistory;
