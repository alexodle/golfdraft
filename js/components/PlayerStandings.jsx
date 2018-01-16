// @flow
'use strict';

const _ = require("lodash");
const cx = require('classnames');
const GolferStore = require('../stores/GolferStore');
const UserStore = require('../stores/UserStore');
const React = require("react");
const utils = require('../../common/utils');

const ReactPropTypes = React.PropTypes;

const UserStandings = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    userScores: ReactPropTypes.object.isRequired,
    selectedUser: ReactPropTypes.string.isRequired
  },

  render: function () {
    const userScores = _.sortBy(this.props.userScores, 'total');
    const userTotals = _.pluck(userScores, 'total');
    const topScore = userTotals[0];

    const trs = _.map(userScores, function (ps) {
      const p = UserStore.getUser(ps.user);
      const userIsMe = this.props.currentUser._id === p._id;
      const userIsSelected = this.props.selectedUser === p._id;
      const viewUser = _.partial(this._onUserSelect, p._id);
      const holesLeft = _.sum(ps.scoresByGolfer, function (gs) {
        if (_.any(gs.missedCuts)) {
          return 0;
        } else if (gs.thru === null) {
          return 18;
        } else {
          return 18 - gs.thru;
        }
      });

      return (
        <tr
          key={p._id}
          className={cx({
            'selected-user-row': userIsSelected
          })}
          onClick={viewUser}
        >
          <td>{_.sortedIndex(userTotals, ps.total) + 1}</td>
          <td>{userIsMe ? (<b>{p.name}</b>) : p.name}</td>
          <td>{utils.toGolferScoreStr(ps.total)}</td>
          <td>{ps.pickNumber + 1}</td>
          <td className='hidden-xs'>{holesLeft > 0 ? holesLeft : 'F'}</td>
          {_.map(ps.scoresByDay, function (ds) {
            return (<td className='hidden-xs' key={ds.day}>{utils.toGolferScoreStr(ds.total)}</td>);
          })}
          <td className='visible-xs'><a href='#UserDetails' onClick={viewUser}>Details</a></td>
        </tr>
      );
    }, this);

    return (
      <section>
        <p>
          <small>
            <b>Tip:</b> Click on a user row to view score details
          </small>
        </p>
        <table className='table standings-table table-hover'>
          <thead>
            <tr>
              <th>#</th>
              <th>Pool User</th>
              <th>Total</th>
              <th>Pick Number</th>
              <th className='hidden-xs'>Holes Left Today</th>
              <th className='hidden-xs'>Day 1</th>
              <th className='hidden-xs'>Day 2</th>
              <th className='hidden-xs'>Day 3</th>
              <th className='hidden-xs'>Day 4</th>
              <th className='visible-xs'></th>
            </tr>
          </thead>
          <tbody>{trs}</tbody>
        </table>
      </section>
    );
  },

  _onUserSelect: function (pid) {
    this.props.onUserSelect(pid);
  }

});

module.exports = UserStandings;
