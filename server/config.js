var cfg = {
  prod: !process.env.DEBUG,

  mongo_url: process.env.MONGOLAB_URI || "mongodb://localhost:27017/test",
  redis_url: process.env.REDISTOGO_URL || "redis://:@localhost:6379/0",

  tourney_id: process.env.TOURNEY_ID || '5376879322ed79dd19a07148',

  cdn_url: process.env.CDN_URL || '',

  // Unsafe not to hash. But who cares in this case? Matt Simon cares.
  admin_password: process.env.ADMIN_PASS || 'admin'
};
cfg.debug = !cfg.prod;

if (cfg.debug) {
  console.log('CONFIG:');
  console.dir(cfg);
}

module.exports = cfg;
