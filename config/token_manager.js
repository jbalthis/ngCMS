/**
 * file: config/token_manager.js
 * desc: jwt token management
 */
var debug = require('debug');
var _ = require('lodash');
var jsonwebtoken = require('jsonwebtoken');

var UnauthorizedAccessError = require('../errors/UnauthorizedAccessError');
var secret = require('./secret').SECRET_TOKEN;
var redis = require('./redis_conf').redis;
var client = require('./redis_conf').redisClient;

module.exports.TOKEN_EXPIRATION = 60;
module.exports.TOKEN_EXPIRATION_SEC = exports.TOKEN_EXPIRATION * 60;


// get token from http headers
module.exports.fetch = function(headers){
    if(headers && headers.authorization){
        if(headers.authorization.split(' ').length === 2){
            return headers.authorization.split(' ')[1];
        }
        else{
            return null;
        }
    }
    else{
        return null;
    }
};


// create new token
module.exports.create = function(user, req, res, next){
    debug("Create token");

    if(_.isEmpty(user)){
        return next(new Error('User data cannot be empty'));
    }

    var data = {
        _id: user._id,
        username: user.username,
        access: user.access,
        name: user.name,
        email: user.email,
        token: jsonwebtoken.sign(
            {
                _id: user._id
            },
            secret,
            {
                expiresInMinutes: exports.TOKEN_EXPIRATION
            }
        )
    };

    data.token_exp = jsonwebtoken.decode(data.token).exp;
    data.token_iat = jsonwebtoken.decode(data.token).iat;

    debug("Token generated for user: %s, token: %s", data.username, data.token);

    client.set(data.token, JSON.stringify(data), function(err, reply){
        if(err){ return next(new Error(err)); }

        if(reply){
            client.expire(data.token, exports.TOKEN_EXPIRATION_SEC, function(err, reply){
                if(err){ return next(new Error("Cannot set the expire value for the token key")) }

                if(reply){
                    req.user = data;
                    next();
                }
                else{
                    return next(new Error("Expiration not set on redis"))
                }
            });
        }
        else{
            return next(new Error("Token not set in redis"))
        }
    });

    return data;
};


// retrieve token from redis
module.exports.retrieve = function(id, done){
    debug("Calling retrive for token: %s", id);

    if(_.isNull(id)){
        return done(new Error('token_invalid'),
            {
                "message": "Invalid token"
            }
        );
    }

    client.get(id, function(err, reply){
        if(err){
            return done(err,
                {
                    "message": err
                }
            );
        }

        if(_.isNull(reply)){
            return done(new Error("token_invalid"),
                {
                    "message": "Token doesn't exist. Are you sure it hasn't expired or been revoked?"
                }
            );
        }
        else{
            var data = JSON.parse(reply);
            debug("User data fetched from redis store for user: %s, data.username");

            if(_.isEqual(data.token, id)){
                return done(null, data);
            }
            else{
                return done(new Error("token_doesnt_exist"),
                    {
                        "message": "Token doesn't exist, login to the system to generate new token."
                    }
                );
            }
        }
    });
};


// expire token in redis
module.exports.expire = function(headers){

    var token = exports.fetch(headers);

    debug("Expiring token: %s", token);

    if(token !== null){
        client.expire(token, 0);
    }

    return token !== null;
};

// verify token in redis
module.exports.verify = function(req, res, next){
    debug("Verifying token");

    var token = exports.fetch(req.headers);

    jsonwebtoken.verify(token, secret, function(err, decode){
        if(err){
            req.user = undefined;
            return next( new UnauthorizedAccessError("invalid_token"));
        }

        exports.retrieve(token, function(err,data){
            if(err){
                req.user = undefined;
                return next(new UnauthorizedAccessError("invalid_token"), data);
            }
            req.user = data;
            next();

        });
    });
};
