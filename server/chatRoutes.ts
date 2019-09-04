import {isEmpty} from 'lodash';
import app from './expressApp';
import {requireSessionApi} from './authMiddleware';
import {Request, Response, NextFunction} from 'express';
import {ChatMessage} from './ServerTypes';

app.get(['/:tourneyId/chat/messages', '/:tourneyId/draft/chat/messages'], requireSessionApi(), async (req: Request, res: Response) => {
  const messages = await req.access.getChatMessages();
  res.status(200).send(messages);
});

app.post(['/:tourneyId/chat/messages', '/:tourneyId/draft/chat/messages'], requireSessionApi(), async (req: Request, res: Response) => {
  const body = req.body;
  const user = req.user;

  if (isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  const message = { user: user._id, message: body.message } as ChatMessage;
  await req.access.createChatMessage(message);
  res.sendStatus(200);
});
