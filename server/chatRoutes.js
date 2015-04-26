'use strict';

var _ = require('lodash');
var app = require('./expressApp');
var access = require('./access');

app.get('/chat/messages', function (req, res) {
  access.getChatMessages()
  .then(function (messages) {
    res.status(200).send(messages);
  })
  .catch(function (err) {
    res.status(500).send(err);
  });
});

app.post('/chat/messages', function (req, res) {
  var body = req.body;
  var user = req.session.user;

  if (!user) {
    res.status(401).send('Must be logged in to post');
    return;
  } else if (_.isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  var message = {
    player: user.player,
    message: body.message
  };
  access.createChatMessage(message)
  .then(function () {
    res.sendStatus(201);
  })
  .catch(function (err) {
    res.status(500).send(err);
  });
});
