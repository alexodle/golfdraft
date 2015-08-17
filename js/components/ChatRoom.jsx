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

var NAME_TAG_RE = /@[a-z]* *[a-z]*$/i;
var TAG_TO_NAME_RE = /~\[([a-z0-9_]+)\]/ig;

var ENTER_KEY = 13;
var DOWN_KEY = 40;
var UP_KEY = 38;

var AutoComplete = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return {
      selectedIndex: 0
    };
  },

  componentWillUpdate: function (nextProps, nextState) {
    var currentIndex = this.state.selectedIndex;
    var newIndex = nextState.selectedIndex;
    if (currentIndex !== newIndex) {
      return;
    }

    var oldChoices = this._getChoices();
    var newChoices = this._getChoices(nextProps);

    if (
        _.isEmpty(oldChoices) ||
        _.isEmpty(newChoices) ||
        !newChoices[currentIndex] ||
        oldChoices[currentIndex].id !== newChoices[currentIndex].id
      ) {

      this.setState({ selectedIndex: 0 });
    }
  },

  render: function () {
    var choices = this._getChoices();

    if (_.isEmpty(choices)) {
      return null;
    }

    var selection = choices[this.state.selectedIndex].id;
    return (
      <form>
        <select
          ref='autocomplete'
          size={3}
          value={selection}
          onChange={this._onChange}
          onClick={this._onClick}
          onKeyUp={this._onKeyUp}
        >
          {_.map(choices, function (u) {
            return (
              <option key={u.id} value={u.id}>{u.name}</option>
            );
          })}
        </select>
      </form>
    );
  },

  forceSelect: function () {
    var choices = this._getChoices();
    this.props.onChoose({ value: choices[this.state.selectedIndex].id });
  },

  forceDown: function () {
    this._move(1);
  },

  forceUp: function () {
    this._move(-1);
  },

  _onChange: function (ev) {
    this.setState({ selectedIndex: ev.currentTarget.selectedIndex });
  },

  _move: function (n) {
    var choices = this._getChoices();
    var currentIndex = this.state.selectedIndex;
    var newIndex = currentIndex + n;

    if (newIndex < 0 || newIndex >= choices.length) {
      return;
    }

    this.setState({ selectedIndex: newIndex });
  },

  _getChoices: function (props) {
    props = props || this.props;

    var text = props.text.toLowerCase();
    var choices = _.chain(props.allChoices)
      .filter(function (u) {
        return u.name.toLowerCase().startsWith(text);
      })
      .value();

    return choices;
  },

  _onClick: function (ev) {
    this.forceSelect();
  },

  _onKeyUp: function (ev) {
    if (ev.keyCode === ENTER_KEY) {
      this.forceSelect();
    }
  }

});

var ChatRoomInput = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return { text: '', taggingText: null };
  },

  render: function () {
    var text = this.state.text;
    var nameTag = this.state.taggingText;

    return (
      <div>
        <form onSubmit={this._onSend}>
          <div className='form-group'>
            <input
              ref='input'
              className='form-control'
              value={text}
              onChange={this._updateText}
              onKeyUp={this._onKeyUp}
            />
            {!nameTag ? null : (
              <AutoComplete
                ref='nameTagger'
                allChoices={_.sortBy(UserStore.getAll(), 'name')}
                text={nameTag[0].substr(1)}
                onChoose={this._onTag} />
            )}
            <button type='submit' className='btn btn-default'>
              Send
            </button>
          </div>
        </form>
      </div>
    );
  },

  _onKeyUp: function (ev) {
    if (this.state.taggingText) {
      if (ev.keyCode === UP_KEY) {
        this.refs.nameTagger.forceUp();
        ev.preventDefault();
      } else if (ev.keyCode === DOWN_KEY) {
        this.refs.nameTagger.forceDown();
        ev.preventDefault();
      }
    }
  },

  _updateText: function (ev) {
    var newText = ev.target.value;
    this.setState({
      text: newText,
      taggingText: newText.match(NAME_TAG_RE)
    });
  },

  _onTag: function (ev) {
    var newText = this.state.text.replace(NAME_TAG_RE, "~[" + ev.value + "] ");
    this.setState({ text: newText, taggingText: null });

    $(this.refs.input.getDOMNode()).focus();
  },

  _onSend: function (ev) {
    ev.preventDefault();

    if (this.state.taggingText) {
      this.refs.nameTagger.forceSelect();
      return;
    }

    var text = this.state.text;
    if (_.isEmpty(text)) return;

    ChatActions.createMessage(text);
    this.setState({ text: '', taggingText: null });

    $(this.refs.input.getDOMNode()).focus();
  }

});

var Message = React.createClass({
  mixins: [PureRenderMixin],

  render: function () {
    var htmlStr = this.props.text.replace(TAG_TO_NAME_RE, function (match, userId) {
      var user = UserStore.getUser(userId);
      if (!user) {
        return match;
      } else {
        return '<span class="user-tag label label-default">' + user.name + '</span>';
      }
    });
    return (
      <span dangerouslySetInnerHTML={{ __html: htmlStr }} />
    );
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
                  <Message text={message.message} />
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
