// @flow
'use strict';

const $ = require('jquery');
const _ = require('lodash');
const Assets = require('../constants/Assets');
const ChatActions = require('../actions/ChatActions');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const moment = require('moment');
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

class AutoComplete extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      selectedIndex: 0
    };
  }

  componentWillUpdate(nextProps, nextState) {
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
        oldChoices[currentIndex]._id !== newChoices[currentIndex]._id
      ) {

      this.setState({ selectedIndex: 0 });
    }
  }

  render() {
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
              <option key={u._id} value={u.name}>{u.name}</option>
            );
          })}
        </select>
      </form>
    );
  }

  forceSelect() {
    const choices = this._getChoices();
    this.props.onChoose({ value: choices[this.state.selectedIndex].name });
  }

  forceDown() {
    this._move(1);
  }

  forceUp() {
    this._move(-1);
  }

  _onChange = (ev) => {
    this.setState({ selectedIndex: ev.currentTarget.selectedIndex });
  }

  _move(n) {
    const choices = this._getChoices();
    const currentIndex = this.state.selectedIndex;
    const newIndex = currentIndex + n;

    if (newIndex < 0 || newIndex >= choices.length) {
      return;
    }

    this.setState({ selectedIndex: newIndex });
  }

  _getChoices(props) {
    props = props || this.props;

    const text = props.text.toLowerCase();
    const choices = _.chain(props.allChoices)
      .filter(function (u) {
        return u.name.toLowerCase().startsWith(text);
      })
      .value();

    return choices;
  }

  _onClick = (ev) => {
    this.forceSelect();
  }

  _onKeyUp = (ev) => {
    if (ev.keyCode === ENTER_KEY) {
      this.forceSelect();
    }
  }

};

class ChatRoomInput extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return { text: '', taggingText: null };
  }

  render() {
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
              onChange={this._onUpdateText}
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
  }

  _onKeyUp = (ev) => {
    if (this.state.taggingText) {
      if (ev.keyCode === UP_KEY) {
        this.refs.nameTagger.forceUp();
        ev.preventDefault();
      } else if (ev.keyCode === DOWN_KEY) {
        this.refs.nameTagger.forceDown();
        ev.preventDefault();
      }
    }
  }

  _onUpdateText = (ev) => {
    const newText = ev.target.value;
    this.setState({
      text: newText,
      taggingText: newText.match(NAME_TAG_RE)
    });
  }

  _onTag = (ev) => {
    const newText = this.state.text.replace(NAME_TAG_RE, "~[" + ev.value + "] ");
    this.setState({ text: newText, taggingText: null });

    $(this.refs.input).focus();
  }

  _onSend = (ev) => {
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

};

class Message extends React.PureComponent {

  render() {
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

};

class ChatRoom extends React.PureComponent {

  propTypes: {
    messages: ReactPropTypes.array
  }

  componentDidMount() {
    this._forceScroll();
  }

  componentDidUpdate(prevProps) {
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
  }

  render() {
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
  }

  _forceScroll() {
    const refs = this.refs;
    const $panel = $(refs.chatPanel);
    const $body = $(refs.chatPanelBody);
    $panel.scrollTop($body.height());
  }

};

module.exports = ChatRoom;
