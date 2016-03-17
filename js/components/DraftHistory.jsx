'use strict';

var _ = require('lodash');
var DraftStore = require('../stores/DraftStore');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferLogic = require('../logic/GolferLogic');
var GolferStore = require('../stores/GolferStore');
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');
var ReactCSSTransitionGroup = require('react/lib/ReactCSSTransitionGroup');

var DraftHistory = React.createClass({

  render: function () {
    var draftPicks = _.clone(this.props.draftPicks).reverse();
    return (
      <GolfDraftPanel heading='Draft History'>
        <table className='table'>
          <thead><tr><th>#</th><th>Pool Player</th><th>Golfer</th></tr></thead>
          <ReactCSSTransitionGroup
            transitionName="tablerow"
            component="tbody"
            transitionLeave={false}
            transitionEnterTimeout={100}
          >
            {_.map(draftPicks, function (p) {
              return (
                <tr key={p.pickNumber}>
                  <td>{p.pickNumber + 1}</td>
                  <td>{PlayerStore.getPlayer(p.player).name}</td>
                  <td>{GolferLogic.renderGolfer(GolferStore.getGolfer(p.golfer))}</td>
                </tr>
              );
            })}
          </ReactCSSTransitionGroup>
        </table>
      </GolfDraftPanel>
    );
  }

});

module.exports = DraftHistory;
