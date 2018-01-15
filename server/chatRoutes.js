'use strict';

const _ = require('lodash');
const app = require('./expressApp');
const access = require('./access');

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
  const body = req.body;
  const user = req.session.user;

  if (!user) {
    res.status(401).send('Must be logged in to post');
    return;
  } else if (_.isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  const message = {
    user: user.user,
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
