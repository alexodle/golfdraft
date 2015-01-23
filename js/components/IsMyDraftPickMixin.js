'use strict';

var ReactPropTypes = require('react').PropTypes;

var IsMyDraftPickMixin = {

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    currentPick: ReactPropTypes.object
  },

  isMyDraftPick: function (props /* optional */) {
    props = props || this.props;
    return !!(
      props.currentUser &&
      props.currentPick &&
      props.currentPick.player === props.currentUser.player
    );
  }

};

module.exports = IsMyDraftPickMixin;
