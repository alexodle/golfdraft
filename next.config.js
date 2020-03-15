module.exports = () => {
  if (!process.env.BASE_URL) {
    throw new Error('Missing required env var at build-time')
  }
  return {
    env: {
      BASE_URL: process.env.BASE_URL,
      ASSET_URL: process.env.BASE_URL,
    }
  }
}
