import Head from 'next/head'
import { NextPage } from 'next'
import { Layout } from '../components/Layout'
import Link from 'next/link'

const Home: NextPage = () => (
  <Layout>
    <h1>Hello, and welcome, friend</h1>
    <Link href='/me'><a>Me</a></Link>
  </Layout>
)

export default Home
