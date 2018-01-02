'use strict';

var _ = require('lodash');
var cx = require('classnames');
var DraftStore = require('../stores/DraftStore');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');
var UserStore = require('../stores/UserStore');

var ReactPropTypes = React.PropTypes;

var DraftPickOrder = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    pickingForPlayers: ReactPropTypes.array.isRequired,
    onPlayerSelected: ReactPropTypes.func.isRequired,
    currentPick: ReactPropTypes.object
  },

  render: function () {
    var pickingForPlayers = this.props.pickingForPlayers;

    var currentPick = this.props.currentPick;
    var currentPlayer = currentPick ? currentPick.player : null;

    var myPlayer = this.props.currentUser.player;
    var pickOrder = DraftStore.getPickOrder();
    pickOrder = _.first(pickOrder, pickOrder.length / 4);
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
            var player = pick.player;
            var text = PlayerStore.getPlayer(player).name;
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
