import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from "next";
import { Auth0State } from "../../server/models";
import { ensureMongoConnect } from "../../server/mongooseUtil";
import { auth } from '../../util/auth';
import { createRequestHandler } from "../../util/requestHandler";

async function createAuth0State(redirectUrl: string): Promise<string> {
  await ensureMongoConnect()
  const nonce = crypto.randomBytes(16).toString('base64')
  await Auth0State.create({ nonce, redirectUrl })
  return nonce
}

const login = async (req: NextApiRequest, res: NextApiResponse) => {
  const redirectUrl = req.query.redirect as string || '/'
  const nonce = await createAuth0State(redirectUrl)
  await auth.handleLogin(req, res, { authParams: { state: nonce } })
}

export default createRequestHandler({ get: login })
