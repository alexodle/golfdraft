'use strict';

const $ = require('jquery');
const _ = require('lodash');
const ChatActions = require('../actions/ChatActions');
const Assets = require('../constants/Assets');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const moment = require('moment');
const UserStore = require('../stores/UserStore');
const PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
const React = require('react');
const UserStore = require('../stores/UserStore');

const BOT_NAME = 'DraftBot';

const ReactPropTypes = React.PropTypes;

const newMessageSound = new Audio(Assets.NEW_CHAT_MESSAGE_SOUND);

const NAME_TAG_RE = /@[a-z]* *[a-z]*$/i;
const TAG_TO_NAME_RE = /~\[([^\]]+)\]/ig;
const SPECIFIC_TAG = "~[{{name}}]";

const ENTER_KEY = 13;
const DOWN_KEY = 40;
const UP_KEY = 38;

const AutoComplete = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return {
      selectedIndex: 0
    };
  },

  componentWillUpdate: function (nextProps, nextState) {
    const currentIndex = this.state.selectedIndex;
    const newIndex = nextState.selectedIndex;
    if (currentIndex !== newIndex) {
      return;
    }

    const oldChoices = this._getChoices();
    const newChoices = this._getChoices(nextProps);

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
    const choices = this._getChoices();

    if (_.isEmpty(choices)) {
      return null;
    }

    const selection = choices[this.state.selectedIndex].name;
    return (
      <form>
        <select
          ref='autocomplete'
          className='form-control'
          size={3}
          value={selection}
          onChange={this._onChange}
          onClick={this._onClick}
          onKeyUp={this._onKeyUp}
        >
          {_.map(choices, function (u) {
            return (
              <option key={u.id} value={u.name}>{u.name}</option>
            );
          })}
        </select>
      </form>
    );
  },

  forceSelect: function () {
    const choices = this._getChoices();
    this.props.onChoose({ value: choices[this.state.selectedIndex].name });
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
    const choices = this._getChoices();
    const currentIndex = this.state.selectedIndex;
    const newIndex = currentIndex + n;

    if (newIndex < 0 || newIndex >= choices.length) {
      return;
    }

    this.setState({ selectedIndex: newIndex });
  },

  _getChoices: function (props) {
    props = props || this.props;

    const text = props.text.toLowerCase();
    const choices = _.chain(props.allChoices)
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

const ChatRoomInput = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function () {
    return { text: '', taggingText: null };
  },

  render: function () {
    const text = this.state.text;
    const nameTag = this.state.taggingText;

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
    const newText = ev.target.value;
    this.setState({
      text: newText,
      taggingText: newText.match(NAME_TAG_RE)
    });
  },

  _onTag: function (ev) {
    const newText = this.state.text.replace(NAME_TAG_RE, "~[" + ev.value + "] ");
    this.setState({ text: newText, taggingText: null });

    $(this.refs.input).focus();
  },

  _onSend: function (ev) {
    ev.preventDefault();

    if (this.state.taggingText) {
      this.refs.nameTagger.forceSelect();
      return;
    }

    const text = this.state.text;
    if (_.isEmpty(text)) return;

    ChatActions.createMessage(text);
    this.setState({ text: '', taggingText: null });

    $(this.refs.input).focus();
  }

});

const Message = React.createClass({
  mixins: [PureRenderMixin],

  render: function () {
    // Escape html BEFORE adding tags
    const text = _.escape(this.props.text);

    // Add tag html
    const htmlStr = text.replace(TAG_TO_NAME_RE, function (match, name) {
      const user = UserStore.getUserByName(name);
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

const ChatRoom = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    messages: ReactPropTypes.array
  },

  componentDidMount: function () {
    this._forceScroll();
  },

  componentDidUpdate: function (prevProps) {
    // Don't process these until we have initially loaded messages
    if (!prevProps.messages) {
      if (this.props.messages) {
        this._forceScroll();
      }
      return;
    }

    const prevMessagesLength = prevProps.messages ? prevProps.messages.length : 0;
    const newMessagesLength = this.props.messages ? this.props.messages.length : 0;

    if (newMessagesLength > prevMessagesLength) {
      const myTagStr = SPECIFIC_TAG.replace("{{name}}", this.props.currentUser.name);
      const addedMessages = this.props.messages.slice(prevMessagesLength, newMessagesLength);
      const tagsMe = _.some(addedMessages, function (msg) {
        return msg.message.includes(myTagStr);
      });
      if (tagsMe) {
        newMessageSound.play();
      }

      this._forceScroll();
    }
  },

  render: function () {
    const messages = this.props.messages;

    let body = null;
    if (!messages) {
      body = (<span>Loading...</span>);

    } else if (_.isEmpty(messages)) {
      body = (<span>No messages. Be the first! Speak your mind.</span>);

    } else {
      body = (
        <dl className='chat-list dl-horizontal'>
          {_.map(messages, function (message, i) {
            const displayName = message.isBot ?
              BOT_NAME : UserStore.getUser(message.user).name;
            const className = message.isBot ? 'bot-message' : '';
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
                  {_.chain(this.props.activeUsers)
                    .map(function (count, user) {
                      return UserStore.getUser(user).name;
                    })
                    .sort()
                    .map(function (userName) {
                      return (
                        <li key={userName}>{userName}</li>
                      );
                    })
                    .value()
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </GolfDraftPanel>
    );
  },

  _forceScroll: function () {
    const refs = this.refs;
    const $panel = $(refs.chatPanel);
    const $body = $(refs.chatPanelBody);
    $panel.scrollTop($body.height());
  }

});

module.exports = ChatRoom;
