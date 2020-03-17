import { initAuth0 } from '@auth0/nextjs-auth0';
import { NextPageContext } from 'next';
import { User } from '../common/types/CommonTypes';

const requiredEnv = (k: string): string => {
  const v = process.env[k]
  if (!v && typeof window === undefined) {
    throw new Error(`Missing required env var: ${k}`)
  }
  return v
}

export const auth = initAuth0({
  domain: requiredEnv('AUTH0_DOMAIN'),
  clientId: requiredEnv('AUTH0_CLIENT_ID'),
  clientSecret: requiredEnv('AUTH0_CLIENT_SECRET'),
  scope: 'openid profile',
  redirectUri: `${process.env.BASE_URL}/api/callback`,
  postLogoutRedirectUri: `${process.env.BASE_URL}/`,
  session: {
    cookieSecret: requiredEnv('SESSION_SECRET'),
    cookieLifetime: 60 * 60 * 8
  }
});

export const clientEnsureAuthenticated = async ({ req, res }: NextPageContext, redirect: string): Promise<User | undefined> => {
  const urlEncodedRedirect = encodeURIComponent(`${process.env.BASE_URL}${redirect}`)
  const loginURL = `${process.env.BASE_URL}/api/login?redirect=${urlEncodedRedirect}`

  if (typeof window === 'undefined') {
    const session = await auth.getSession(req)
    if (!session) {
      res.writeHead(302, { Location: loginURL }).end()
      return
    }
    return session.user as User
  }

  const meRes = await fetch(`${process.env.BASE_URL}/api/me`)
  if (!meRes.ok) {
    if (meRes.status === 403) {
      window.location.href = loginURL
      return
    } else {
      throw new Error(`Cannot fetch me: ${meRes.statusText} (${meRes.status})`)
    }
  }

  return await meRes.json() as User
}
