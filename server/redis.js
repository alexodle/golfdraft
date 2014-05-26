var config = require('./config');
var redis = require("redis"); redis.debug_mode = true;
var redisUrl = require("url").parse(config.redis_url);
var redisCli = redis.createClient(redisUrl.port, redisUrl.hostname);
redisCli.auth(redisUrl.auth.split(":")[1]);

redisCli.on("error", function (err) {
  console.log("REDIS ERROR - " + err);
});

module.exports = {
  redis: redis,
  client: redisCli
};
