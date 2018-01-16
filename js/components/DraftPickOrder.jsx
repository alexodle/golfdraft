// @flow
'use strict';

const _ = require('lodash');
const cx = require('classnames');
const DraftStore = require('../stores/DraftStore');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const React = require('react');
const UserStore = require('../stores/UserStore');

const ReactPropTypes = React.PropTypes;

const DraftPickOrder = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    pickingForUsers: ReactPropTypes.array.isRequired,
    onUserSelected: ReactPropTypes.func.isRequired,
    currentPick: ReactPropTypes.object,
    autoPickUsers: ReactPropTypes.object
  },

  render: function () {
    const {pickingForUsers, currentPick, currentUser, autoPickUsers} = this.props;
    const myUser = currentUser._id;

    let pickOrder = DraftStore.getPickOrder();
    pickOrder = _.first(DraftStore.getPickOrder(), pickOrder.length / 4);

    return (
      <div>
        <p><small>
          <b>Tip:</b> your are picking for all users in bold
        </small></p>
        <p><small>
          <b>Pro Tip:</b> click on a user to see their picks
        </small></p>
        <ol className='pick-order-list'>
          {_.map(pickOrder, function (pick, i) {
            return (
              <li
                key={pick.user}
                className={cx({
                  'my-user': (
                    myUser === pick.user ||
                    _.contains(pickingForUsers, pick.user)
                  ),
                  'current-user': myUser === pick.user
                })}
              >
                {!autoPickUsers[pick.user] ? null : (
                  <span><span className='label label-success auto-label'>AUTO</span> </span>
                )}
                <a href='#DraftHistory' onClick={_.partial(this._onSelect, pick.user)}>
                  {UserStore.getUser(pick.user).name}
                </a>
              </li>);
          }, this)}
        </ol>
      </div>
    );
  },

  _onSelect: function (pid) {
    this.props.onUserSelected(pid);
  }

});

module.exports = DraftPickOrder;
