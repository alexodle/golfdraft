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

var TEMP_NAMES = [
  "Alex Odle",
  "Al Bundy",
  "Bill James",
  "Billy Beane"
];

var NAME_TAG_RE = /@[a-z]* *[a-z]*$/i;

var ENTER_KEY = 13;

var AutoComplete = React.createClass({

  render: function () {
    var text = this.props.text.toLowerCase();
    var choices = _.filter(TEMP_NAMES, function (n) {
      return n.toLowerCase().startsWith(text);
    });

    if (_.isEmpty(choices)) {
      return null;
    }

    return (
      <form>
        <select
          ref='autocomplete'
          size={3}
          defaultValue={choices[0]}
          onClick={this._onClick}
          onKeyUp={this._onKeyUp}
        >
          {_.map(choices, function (ch) {
            return (
              <option key={ch} value={ch}>{ch}</option>
            );
          })}
        </select>
      </form>
    );
  },

  _onClick: function (ev) {
    this.props.onChoose({ value: ev.target.value });
  },

  _onKeyUp: function (ev) {
    if (ev.keyCode === ENTER_KEY) {
      this.props.onChoose({ value: ev.target.value });
    }
  }

});

var ChatRoomInput = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return { text: '' };
  },

  render: function () {
    var text = this.state.text;

    var nameTag = text.match(NAME_TAG_RE);

    return (
      <div>
        <form onSubmit={this._onSend}>
          <div className='form-group'>
            <input
              ref='input'
              className='form-control'
              value={text}
              onChange={this._updateText}
            />
            {!nameTag ? null : (
              <AutoComplete text={nameTag[0].substr(1)} onChoose={this._onTag} />
            )}
            <button type='submit' className='btn btn-default'>
              Send
            </button>
          </div>
        </form>
      </div>
    );
  },

  _updateText: function (ev) {
    this.setState({ text: ev.target.value });
  },

  _onTag: function (ev) {
    var newText = this.state.text.replace(NAME_TAG_RE, "~[" + ev.value + "] ");
    this.setState({ text: newText });

    $(this.refs.input.getDOMNode()).focus();
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
