var cfg = {
  prod: !!process.env.PROD,

  mongo_url: process.env.MONGOHQ_URL || "mongodb://localhost:27017/test",
  redis_url: process.env.REDISTOGO_URL || "redis://localhost:6379/0",

  draft_id: process.env.DRAFT_ID || '537114cc22ed79dd19a07142',
  tourney_id: process.env.TOURNEY_ID || '5376879322ed79dd19a07148'
};

module.exports = cfg;
