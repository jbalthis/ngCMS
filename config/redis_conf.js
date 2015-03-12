/**
 * file: config/redis_conf.js
 * desc: create a connection to a redis key:value store
 * author: Jason Balthis
 * email: jason.balthis@gmail.com
 */
var debug = require('debug');
var redis = require('redis');
var redisClient = redis.createClient(6379);

redisClient.on('error', function(err){
    debug(err);
});

redisClient.on('connect', function(){
    debug('Redis is ready...');
});

module.exports.redis = redis;
module.exports.redisClient = redisClient;