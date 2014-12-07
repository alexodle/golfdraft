/** @jsx React.DOM */
'use strict';

var $ = require('jquery');
var _ = require('lodash');
var ChatActions = require('../actions/ChatActions');
var moment = require('moment');
var PlayerStore = require('../stores/PlayerStore');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var React = require('react');

var ReactPropTypes = React.PropTypes;

var ChatRoomInput = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return { text: '' };
  },

  render: function () {
    return (
      <form onSubmit={this._onSend}>
        <div className='form-group'>
          <input
            className='form-control'
            value={this.state.text}
            onChange={this._updateText}
          />
          <button type='submit' className='btn btn-default'>
            Send
          </button>
        </div>
      </form>
    );
  },

  _updateText: function (ev) {
    this.setState({ text: ev.target.value });
  },

  _onSend: function (ev) {
    ev.preventDefault();

    var text = this.state.text;
    if (_.isEmpty(text)) return;

    ChatActions.createMessage(text);
    this.setState({ text: '' });
  }

});

var ChatRoom = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    messages: ReactPropTypes.array
  },

  componentDidMount: function () {
    this._forceScroll();
  },

  componentDidUpdate: function () {
    this._forceScroll();
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
        <div className='panel panel-default chat-panel' ref='chatPanel'>
          <div className='panel-body' ref='chatPanelBody'>
            {body}
          </div>
        </div>
        {!messages ? null : (<ChatRoomInput />)}
      </section>
    );
  },

  _forceScroll: function () {
    var refs = this.refs;
    var $panel = $(refs.chatPanel.getDOMNode());
    var $body = $(refs.chatPanelBody.getDOMNode());
    $panel.scrollTop($body.height());
  }

});

module.exports = ChatRoom;