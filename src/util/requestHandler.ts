import { NextApiRequest, NextApiResponse } from "next"
import { InvalidRequestError, InvalidRequestErrorStatus, NotFoundError, NotFoundErrorStatus } from "./errors"
import { auth } from "./auth"
import { isArray } from "util"
import { User } from "../server/ServerTypes"

export type Method = 'get' | 'post' | 'put' | 'delete'


export interface HandlerFunc {
  (req: NextApiRequest, res: NextApiResponse): Promise<void>
}

export interface HandlerSpec {
  get?: HandlerFunc,
  post?: HandlerFunc,
  put?: HandlerFunc,
  delete?: HandlerFunc,
}

export function createRequestHandler(spec: HandlerSpec): HandlerFunc {
  const handler = async function (req: NextApiRequest, res: NextApiResponse) {
    const method = (req.method || '').toLowerCase()
    const methodHandler = spec[method as Method]
    if (!methodHandler) {
      return res.status(NotFoundErrorStatus).json({ error: `not found: ${req.method}` })
    }

    try {
      await methodHandler(req, res)
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(NotFoundErrorStatus).json({ error: 'not found' })
      } else if (e instanceof InvalidRequestError) {
        res.status(InvalidRequestErrorStatus).json({ error: 'invalid request' })
      } else {
        console.error(e)
        if (process.env.NODE_ENV !== 'production') {
          res.status(e.status || 500).end(e.message)
        } else {
          res.status(e.status || 500).end()
        }
      }
    }
  }
  return handler;
}
