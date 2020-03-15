import { NextApiRequest, NextApiResponse } from "next"
import { InvalidRequestError, InvalidRequestErrorStatus, NotFoundError, NotFoundErrorStatus } from "./errors"

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
          res.status(500).json({ error: e.message })
        } else {
          res.status(500).json({ error: 'error' })
        }
      }
    }
  }
  return handler;
}
