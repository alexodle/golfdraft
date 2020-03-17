import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import { Layout } from '../components/Layout'
import { auth, clientEnsureAuthenticated } from '../util/auth'

interface MeProps {
  user: any
}

const MePage: NextPage<MeProps> = ({ user }) => {
  return (
    <Layout>
      <h2>ME</h2>
      <code>{JSON.stringify(user)}</code>
    </Layout>
  )
}

MePage.getInitialProps = async (ctx: NextPageContext) => {
  const user = await clientEnsureAuthenticated(ctx, '/me')
  if (!user) {
    return null
  }
  return { user }
}

export default MePage
