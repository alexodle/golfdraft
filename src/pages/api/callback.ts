import { NextApiRequest, NextApiResponse } from "next";
import { Auth0State } from "../../server/models";
import { auth } from '../../util/auth';
import { InvalidRequestError } from "../../util/errors";
import { createRequestHandler } from "../../util/requestHandler";

const callback = async (req: NextApiRequest, res: NextApiResponse) => {
  const nonce = req.query.state as string
  const state = await Auth0State.findOneAndRemove({ nonce }).exec()
  if (!state) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Failed login callback, query: ${req.query}`)
    }
    throw new InvalidRequestError('Invalid nonce')
  }
  await auth.handleCallback(req, res, { redirectTo: (state as any).redirectUrl })
}

export default createRequestHandler({ get: callback })
