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
    var selectedPlayerId = this.props.selectedPlayerId;
    var onPersonClick = this._onPersonClick;
    var heading = 'Draft History';

    if (selectedPlayerId) {
      draftPicks = _.where(draftPicks, { player: selectedPlayerId });
      heading = (
        <span>
          <a href='#DraftHistory' onClick={this._onDeselectPerson}>Draft History</a>
          <span> - </span>{PlayerStore.getPlayer(selectedPlayerId).name}
        </span>
      );
    }

    return (
      <div>
        <a name='DraftHistory' />
        <GolfDraftPanel heading={heading}>
          <table className='table'>
            <thead><tr><th>#</th><th>Pool Player</th><th>Golfer</th></tr></thead>
            <tbody>
              {_.map(draftPicks, function (p) {
                var playerName = PlayerStore.getPlayer(p.player).name;
                return (
                  <tr key={p.pickNumber}>
                    <td>{p.pickNumber + 1}</td>
                    <td>
                      {selectedPlayerId ? playerName : (
                        <a href='#DraftHistory' onClick={_.partial(onPersonClick, p.player)}>
                          {playerName}
                        </a>
                      )}
                    </td>
                    <td>{GolferLogic.renderGolfer(GolferStore.getGolfer(p.golfer))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GolfDraftPanel>
      </div>
    );
  },

  _onPersonClick: function (pid) {
    this.props.onSelectionChange(pid);
  },

  _onDeselectPerson: function () {
    this.props.onSelectionChange(null);
  }

});

module.exports = DraftHistory;
