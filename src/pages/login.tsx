import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import { Layout } from '../components/Layout'
import WhoIsYou from '../components/WhoIsYou'
import { User } from '../types/ClientTypes'

interface LoginPageProps {
  usernames: string[]
  invalidAuth: boolean
  redirectTo?: string
}

const LoginPage: NextPage<LoginPageProps> = ({ usernames, invalidAuth, redirectTo }) => (
  <Layout>
    <WhoIsYou usernames={usernames} invalidAuth={invalidAuth} redirectTo={redirectTo} />
  </Layout>
)

LoginPage.getInitialProps = async ({ query }): Promise<LoginPageProps> => {
  const invalidAuth = !!query.invalidAuth
  const redirectTo = query.redirect as string || undefined

  const usersResponse = await fetch(`${process.env.BASE_URL}/api/users`)
  if (!usersResponse.ok) {
    throw new Error(`invalid response: ${usersResponse.status} - ${usersResponse.text}`)
  }
  const json = await usersResponse.json()
  const users: User[] = json.users
  const usernames = users.map(u => u.username)

  return { usernames, invalidAuth, redirectTo }
}

export default LoginPage
