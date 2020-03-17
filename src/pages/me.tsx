import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import { Layout } from '../components/Layout'
import { auth } from '../util/auth'

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

MePage.getInitialProps = async ({ res, req }) => {
  let user = {}
  if (typeof window === 'undefined') {
    const session = await auth.getSession(req)
    const urlEncodedRoute = encodeURIComponent(`${process.env.BASE_URL}/me`)
    if (!session) {
      res.writeHead(302, { Location: `${process.env.BASE_URL}/api/login?redirect=${urlEncodedRoute}` }).end()
      return
    }
    user = session.user
  } else {
    const meRes = await fetch(`${process.env.BASE_URL}/api/me`)
    if (!meRes.ok) {
      if (meRes.status === 403) {
        window.location.href = `${process.env.BASE_URL}/api/login`
        return
      } else {
        throw new Error(`Cannot fetch me: ${meRes.statusText} (${meRes.status})`)
      }
    }
  }
  return { user }
}

export default MePage
