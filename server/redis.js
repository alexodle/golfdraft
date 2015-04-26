var config = require('./config');
var redis = require("redis");

if (!config.prod) {
  redis.debug_mode = true;
}

var redisUrl = require("url").parse(config.redis_url);

function createClient() {
  var redisCli = redis.createClient(redisUrl.port, redisUrl.hostname);
  redisCli.auth(redisUrl.auth.split(":")[1]);

  redisCli.on("error", function (err) {
    console.log("REDIS ERROR - " + err);
  });

  return redisCli;
}

module.exports = {
  redis: redis,
  pubSubClient: createClient(),
  client: createClient()
};
