const cfg = {
  devMode: process.env.NODE_ENV === 'development',

  mongo_url: process.env.MONGO_URI || "mongodb://gd:gd@127.0.0.1:27017/gd",
  redis_url: process.env.REDIS_URL || "redis://:@127.0.0.1:6379/0",

  cdn_url: process.env.CDN_URL || '',

  admin_password: process.env.ADMIN_PASS || 'admin',

  session_secret: process.env.SESSION_SECRET || 'dev_session_secret'
};

if (cfg.devMode) {
  console.log('CONFIG:');
  console.dir(cfg);
}

export default cfg;
