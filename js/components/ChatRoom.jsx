/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var React = require('react');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var PlayerStore = require('../stores/PlayerStore');
var moment = require('moment');

var ReactPropTypes = React.PropTypes;

var DraftHistory = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    messages: ReactPropTypes.array.isRequired
  },

  render: function () {
    var messages = this.props.messages;
    return (
      <section>
        <h2>Chat Room!</h2>
        {!messages ? (<span>Loading...</span>) : (
          <ul className='chat-list list-unstyled'>
            {_.map(messages, function (message, i) {
              return (
                <li key={i}>
                  {PlayerStore.getPlayer(message.player).name}
                  <span className='message-date'> (
                    {moment(message.date).calendar()}
                  )</span>: {message.message}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

});

module.exports = DraftHistory;
