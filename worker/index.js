const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const sub = redisClient.duplicate();

console.log("redis_port: " + keys.redisPort + "  redis_host: " +  keys.redisHost);

function fib(index) {
  console.log("fib calculates index: " + index);
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
  console.log("redis on: " + message);
  redisClient.hset('values', message, fib(parseInt(message)));
});
sub.subscribe('insert');