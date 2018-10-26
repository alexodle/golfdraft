import {isEmpty} from 'lodash';
import app from './expressApp';
import {requireSession} from './authMiddleware';
import {Request, Response, NextFunction} from 'express';
import {ChatMessage} from './ServerTypes';

app.get(['/chat/messages', '/:tourney_id/chat/messages'], requireSession(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await req.access.getChatMessages();
    res.status(200).send(messages);
  } catch (err) {
    next(err);
  }
});

app.post('/chat/messages', requireSession(), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  const user = req.user;

  if (isEmpty(body.message)) {
    res.status(400).send('Empty message not accepted');
    return;
  }

  const message = {
    user: user._id,
    message: body.message
  } as ChatMessage;
  try {
    await req.access.createChatMessage(message);
  } catch (err) {
    next(err);
  }
});
