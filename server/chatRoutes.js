'use strict';

const _ = require('lodash');
const access = require('./access');
const app = require('./expressApp');
const requireSession = require('./authMiddleware').requireSession;

app.get('/chat/messages', requireSession(), function (req, res) {
  access.getChatMessages()
  .then(function (messages) {
    res.status(200).send(messages);
  })
  .catch(function (err) {
    res.status(500).send(err);
  });
});

app.post('/chat/messages', requireSession(), function (req, res) {
  const body = req.body;
  const user = req.user;

  if (_.isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  const message = {
    user: user._id,
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
