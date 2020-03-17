import { NextApiRequest, NextApiResponse } from "next";
import { auth } from '../../util/auth';
import { createRequestHandler } from "../../util/requestHandler";

const getProfile = async (req: NextApiRequest, res: NextApiResponse) => {
  await auth.handleProfile(req, res, { refetch: true })
}

export default createRequestHandler({ get: auth.requireAuthentication(getProfile) })
