import { NextFunction, Request, RequestHandler, Response } from 'express';
import * as passport from 'passport';
import * as url from 'url';

function ensureUserApi(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

function ensureUserHtml(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    next();
  } else {
    res.redirect(url.format({
      pathname: "/login",
      query: { redirect: req.get('Referrer') }
    }));
  }
}

function ensureAdminApi(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).send('admin only');
  }
}

export function requireSessionApi(): RequestHandler[] {
  return [passport.authenticate('session'), ensureUserApi];
}

export function requireSessionHtml(): RequestHandler[] {
  return [passport.authenticate('session'), ensureUserHtml];
}

export function requireAdminApi(): RequestHandler[] {
  return [passport.authenticate('session'), ensureUserApi, ensureAdminApi];
}
