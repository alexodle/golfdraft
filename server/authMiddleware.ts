import * as passport from 'passport';
import {Request, Response, NextFunction, RequestHandler} from 'express';

function ensureUser(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

export function requireSession(): RequestHandler[]  {
  return [passport.authenticate('session'), ensureUser];
}
