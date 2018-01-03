'use strict';

const _ = require('lodash');
const cx = require('classnames');
const DraftStore = require('../stores/DraftStore');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const PlayerStore = require('../stores/PlayerStore');
const React = require('react');
const UserStore = require('../stores/UserStore');

const ReactPropTypes = React.PropTypes;

const DraftPickOrder = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    pickingForPlayers: ReactPropTypes.array.isRequired,
    onPlayerSelected: ReactPropTypes.func.isRequired,
    currentPick: ReactPropTypes.object
  },

  render: function () {
    const pickingForPlayers = this.props.pickingForPlayers;

    const currentPick = this.props.currentPick;
    const currentPlayer = currentPick ? currentPick.player : null;

    const myPlayer = this.props.currentUser.player;

    let pickOrder = DraftStore.getPickOrder();
    pickOrder = _.first(DraftStore.getPickOrder(), pickOrder.length / 4);
    return (
      <div>
        <p><small>
          <b>Tip:</b> your are picking for all players in bold
        </small></p>
        <p><small>
          <b>Pro Tip:</b> click on a player to see their picks
        </small></p>
        <ol className='pick-order-list'>
          {_.map(pickOrder, function (pick, i) {
            const player = pick.player;
            const text = PlayerStore.getPlayer(player).name;
            return (
              <li
                key={player}
                className={cx({
                  'my-player': (
                    myPlayer === player ||
                    _.contains(pickingForPlayers, player)
                  ),
                  'current-player': currentPlayer === player
                })}
              >
                <a href='#DraftHistory' onClick={_.partial(this._onSelect, player)}>
                  {text}
                </a>
              </li>);
          }, this)}
        </ol>
      </div>
    );
  },

  _onSelect: function (pid) {
    this.props.onPlayerSelected(pid);
  }

});

module.exports = DraftPickOrder;
