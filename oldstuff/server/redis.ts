import config from './config';
import * as redis from 'redis';

const redisUrl = require("url").parse(config.redis_url);

function createClient() {
  const redisCli = redis.createClient(redisUrl.port, redisUrl.hostname);
  redisCli.auth(redisUrl.auth.split(":")[1]);

  redisCli.on("error", function (err) {
    console.log("REDIS ERROR - " + err);
  });

  return redisCli;
}

const pubSubClient = createClient();
const client = createClient();

function unref() {
  pubSubClient.unref();
  client.unref();
}

export default {
  redis: redis,
  pubSubClient: pubSubClient,
  client: client,
  unref: unref
};
