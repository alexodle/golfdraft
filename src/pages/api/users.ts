import { NextApiRequest, NextApiResponse } from "next";
import { createRequestHandler } from "../../util/requestHandler";
import { getUsers } from '../../server/access';

const get = async (_req: NextApiRequest, res: NextApiResponse) => {
  const users = await getUsers()
  res.status(200).json({ users })
}

export default createRequestHandler({ get })
