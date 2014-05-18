/** @jsx React.DOM */
'use strict';

var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var _ = require('underscore');

var PlayerStore = require('../stores/PlayerStore');
var DraftStore = require('../stores/DraftStore');
var GolferStore = require('../stores/GolferStore');

var DraftHistory = React.createClass({

  render: function () {
    var draftPicks = _.clone(this.props.draftPicks).reverse();
    return (
      <div>
        <h2>Draft history</h2>
        <table className='table'>
          <thead><tr><th>#</th><th>Pool Player</th><th>Golfer</th></tr></thead>
          <tbody>
            <ReactCSSTransitionGroup
              transitionName="table"
              component={React.DOM.tbody}
            >
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
          </tbody>
        </table>
      </div>
    );
  }

});

module.exports = DraftHistory;
