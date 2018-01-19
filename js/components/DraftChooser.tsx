'use strict';

import * as _ from 'lodash';
import AppConstants from '../constants/AppConstants';
import * as cx from 'classnames';
import DraftActions from '../actions/DraftActions';
import GolferLogic from '../logic/GolferLogic';
import GolferStore from '../stores/GolferStore';
import * as React from 'react';
import UserStore from '../stores/UserStore';
import GolfDraftPanel from './GolfDraftPanel';
import {Golfer, DraftPick, User} from '../types/Types';

export interface DraftChooserProps {
  golfersRemaining: string[];
  currentPick: DraftPick;
  syncedPickList: string[] | {};
  currentUser: User;
}

interface DraftChooserState {
  sortKey: string;
  selectedGolfer: string;
}

function isProxyPick(props: DraftChooserProps) {
  return props.currentUser._id !== props.currentPick.user;
}

function shouldShowPickListOption(props: DraftChooserProps) {
  return isProxyPick(props) || !_.isEmpty(props.syncedPickList);
}

export default class DraftChooser extends React.Component<DraftChooserProps, DraftChooserState> {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return this._getSelectionState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const newState = this._getSelectionState(nextProps);
    this.setState(newState);
  }

  render() {
    if (this._isLoading()) {
      return this._renderLoading();
    }

    const golfersRemaining = this.props.golfersRemaining;
    const currentPick = this.props.currentPick;
    const sortKey = this.state.sortKey;
    const isProxyPick = this._isProxyPick();
    const sortedGolfers = this._sortedGolfers(golfersRemaining, sortKey);
    const showPickListOption = shouldShowPickListOption(this.props);

    let header = null;
    if (!isProxyPick) {
      header = (<h4>It&#8217;s your turn! Make your pick.</h4>);
    } else {
      const userName = UserStore.getUser(currentPick.user).name;
      header = (
        <section>
          <h4>Make a pick for: {userName}</h4>
          <p>
            <a href='#' onClick={this._onStopTakingPick}>
              I&#39;ll stop making picks for {userName}
            </a>
          </p>
        </section>
      );
    }

    return (
      <GolfDraftPanel heading='Draft Picker'>
        {header}

        <div className='btn-group' role='group' aria-label='Sorting choices'>
          <label>Sort users by:</label><br />
          {!showPickListOption ? null : (
            <button
              type='button'
              className={cx({
                'btn btn-default': true,
                'active': sortKey === 'pickList'
              })}
              onClick={() => this._setSortKey('pickList')}
            >User Pick List</button>
          )}
          <button
            type='button'
            className={cx({
              'btn btn-default': true,
              'active': sortKey === 'name'
            })}
            onClick={() => this._setSortKey('name')}
          >First Name</button>
          <button
            type='button'
            className={cx({
              'btn btn-default': true,
              'active': sortKey === 'wgr'
            })}
            onClick={() => this._setSortKey('wgr')}
          >World Golf Ranking</button>
        </div>

        <form role='form'>
        {isProxyPick && sortKey === 'pickList' ? (
          <div style={{marginTop: '1em'}}>
            <small>* If no pick list is set, uses next WGR</small><br />
            <button
              className='btn btn-default btn-primary'
              onClick={this._onProxyPickListPick}
            >Select next user on pick list</button>
          </div>
        ) : (
          <div>
            <div className='form-group'>
              <label htmlFor='golfersRemaining'>Select your user:</label>
              <select
                id='golfersRemaining'
                value={this.state.selectedGolfer}
                onChange={this._onChange}
                size={10}
                className='form-control'
              >
                {_.map(sortedGolfers, function (g) {
                  return (
                    <option key={g._id} value={g._id}>
                      {GolferLogic.renderGolfer(g)}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              className='btn btn-default btn-primary'
              onClick={this._onSubmit}
            >
              Pick
            </button>
          </div>
        )}
        </form>
      </GolfDraftPanel>
    );
  }

  _renderLoading() {
    return (
      <GolfDraftPanel heading='Draft Picker'>
        <span>Loading...</span>
      </GolfDraftPanel>
    );
  }

  _isLoading() {
    return this.props.syncedPickList === AppConstants.PROPERTY_LOADING;
  }

  _isProxyPick() {
    return isProxyPick(this.props);
  }

  _sortedGolfers(golfers, sortKey) {
    const isProxyPick = this._isProxyPick();
    if (sortKey === 'pickList') {
      if (isProxyPick) {
        // special case, we cannot show the full list if this a proxy pick
        return null;
      } else {
        return _.chain(this.props.syncedPickList)
          .map(GolferStore.getGolfer)
          .value();
      }
    }
    return _.sortBy(golfers, [sortKey, 'name']);
  }

  _getSelectionState(props) {
    const state = this.state || {} as DraftChooserState;
    const golfersRemaining = props.golfersRemaining;

    let sortKey = state.sortKey;
    let selectedGolfer = state.selectedGolfer;

    if (!sortKey || sortKey === 'pickList') {
      sortKey = shouldShowPickListOption(props) ? 'pickList' : 'wgr';
    }

    if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
      const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
      selectedGolfer = firstGolfer ? firstGolfer._id : null;
    }
    return {
      selectedGolfer: selectedGolfer,
      sortKey: sortKey
    };
  }

  _onChange = (ev) => {
    this.setState({ selectedGolfer: ev.target.value });
  }

  _setSortKey(sortKey) {
    if (sortKey === this.state.sortKey) return;

    const golfersRemaining = this.props.golfersRemaining;
    const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
    const selectedGolfer = firstGolfer ? firstGolfer._id : null;
    this.setState({
      sortKey: sortKey,
      selectedGolfer: selectedGolfer
    });
  }

  _onProxyPickListPick = (ev) => {
    ev.preventDefault();
    DraftActions.makePickListPick();
  }

  _onSubmit = (ev) => {
    ev.preventDefault();
    DraftActions.makePick(this.state.selectedGolfer);
  }

  _onStopTakingPick = (ev) => {
    ev.preventDefault();
    DraftActions.stopDraftingForUser(this.props.currentPick.user);
  }

};
