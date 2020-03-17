import { initAuth0 } from '@auth0/nextjs-auth0';

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
