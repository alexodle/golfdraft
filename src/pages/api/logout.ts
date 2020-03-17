import { NextApiRequest, NextApiResponse } from "next";
import { auth } from '../../util/auth';
import { createRequestHandler } from "../../util/requestHandler";

const logout = async (req: NextApiRequest, res: NextApiResponse) => {
  await auth.handleLogout(req, res)
}

export default createRequestHandler({ get: logout })
