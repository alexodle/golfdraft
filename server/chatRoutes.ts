import * as _ from 'lodash';
import * as access from './access';
import app from './expressApp';
import {requireSession} from './authMiddleware';
import {Request, Response, NextFunction} from 'express';
import {ChatMessage} from './ServerTypes';

app.get('/chat/messages', requireSession(), (req: Request, res: Response, next: NextFunction) => {
  access.getChatMessages()
    .then((messages) => {
      res.status(200).send(messages);
    })
    .catch(next);
});

app.post('/chat/messages', requireSession(), (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  const user = req.user;

  if (_.isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  const message = {
    user: user._id,
    message: body.message
  } as ChatMessage;
  access.createChatMessage(message)
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next);
});
