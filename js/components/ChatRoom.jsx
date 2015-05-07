/** @jsx React.DOM */
'use strict';

var $ = require('jquery');
var _ = require('lodash');
var ChatActions = require('../actions/ChatActions');
var Assets = require('../constants/Assets');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var moment = require('moment');
var PlayerStore = require('../stores/PlayerStore');
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var React = require('react');
var UserStore = require('../stores/UserStore');

var BOT_NAME = 'DraftBot';

var ReactPropTypes = React.PropTypes;

var newMessageSound = new Audio(Assets.NEW_CHAT_MESSAGE_SOUND);

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
            ref='input'
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

    $(this.refs.input.getDOMNode()).focus();
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

  componentDidUpdate: function (prevProps) {
    this._forceScroll();
    if (prevProps.messages && this.props.messages && prevProps.messages.length !== this.props.messages.length) {
      newMessageSound.play();
    }
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
        <dl className='chat-list dl-horizontal'>
          {_.map(messages, function (message, i) {
            var displayName = message.isBot ?
              BOT_NAME : PlayerStore.getPlayer(message.player).name;
            var className = message.isBot ? 'bot-message' : '';
            return [
              (
                <dt key={'dt' + i} className={className}>
                  {displayName} <span className='message-date'>
                    ({moment(message.date).calendar()})
                  </span>:
                </dt>
              ),
              (
                <dd key={'dd' + i} className={className}>
                  {message.message}
                </dd>
              )
            ];
          })}
        </dl>
      );
    }

    return (
      <GolfDraftPanel heading='Chat Room'>
        <div className='row'>
          <div className='col-md-9'>
            <div className='panel panel-default chat-panel' ref='chatPanel'>
              <div className='panel-body' ref='chatPanelBody'>
                {body}
              </div>
            </div>
            {!messages ? null : (<ChatRoomInput />)}
          </div>
          <div className='col-md-3'>
            <div className='panel panel-default'>
              <div className='panel-body'>
                <b>Online:</b>
                <ul className='list-unstyled'>
                  {_.map(this.props.activeUsers, function (count, user) {
                    return (
                      <li key={user}>{UserStore.getUser(user).name}</li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </GolfDraftPanel>
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
