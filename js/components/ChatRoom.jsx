/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var React = require('react');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var PlayerStore = require('../stores/PlayerStore');
var moment = require('moment');

var ReactPropTypes = React.PropTypes;

var ChatRoom = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    messages: ReactPropTypes.array
  },

  render: function () {
    var messages = this.props.messages;

    var body = null;
    if (!messages) {
      body = (<span>Loading...</span>);

    } else if (_.isEmpty(messages)) {
      body = (<span>No messages. Be the first! Speak your mind.</span>);

    } else {
      body = (
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
      );
    }

    return (
      <section>
        <h2>Chat Room!</h2>
        {body}
      </section>
    );
  }

});

module.exports = ChatRoom;
