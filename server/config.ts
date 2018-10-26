const cfg = {
  prod: !process.env.DEBUG,
  debug: !!process.env.DEBUG,

  mongo_url: process.env.MONGO_URI || "mongodb://gd:gd@127.0.0.1:27017/gd",
  redis_url: process.env.REDIS_URL || "redis://:@127.0.0.1:6379/0",

  current_tourney_id: process.env.TOURNEY_ID || '5376879322ed79dd19a07148',

  cdn_url: process.env.CDN_URL || '',

  admin_password: process.env.ADMIN_PASS || 'admin',

  tourney_cfg: process.env.TOURNEY_CFG || 'tourney_cfg.json',

  session_secret: process.env.SESSION_SECRET || 'dev_session_secret'
};

if (cfg.debug) {
  console.log('CONFIG:');
  console.dir(cfg);
}

export default cfg;
