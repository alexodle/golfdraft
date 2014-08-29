var cfg = {
  prod: !!process.env.PROD,

  mongo_url: process.env.MONGOHQ_URL || "mongodb://localhost:27017/test",
  redis_url: process.env.REDISTOGO_URL || "redis://:@localhost:6379/0",

  tourney_id: process.env.TOURNEY_ID || '5376879322ed79dd19a07148'
};

module.exports = cfg;
