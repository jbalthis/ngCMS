/**
 * routes/users
 */
"use strict";
var debug = require('debug');
var jwt = require('express-jwt');
var _ = require('lodash');
var UnauthorizedAccessError = require('../errors/UnauthorizedAccessError');
var secret = require('../config/secret').SECRET_TOKEN;
var redisClient = require('../config/redis_conf').redisClient;
var tokenManager = require('../config/token_manager');
var User = require('../models/User');

// register new user
module.exports.register = function(req, res, next){

    debug("Begin new user registration");

    var username = req.body.username || '';
    var password = req.body.password || '';

    debug("username: %s, password: %s", username, password);

    if(_.isEmpty(username) || _.isEmpty(password)){
        return next(new UnauthorizedAccessError("401", {
            message: 'Both a username and password must be supplied'
        }));
    }

    var user = new User();
    user.username = username;
    user.password = password;

    debug("Creating a new user in mongodb");
    user.save(function(err){
        if(err){
            debug('Error In Save: '+err);
            return res.sendStatus(500);
        }
        else {
            debug(user);
        }

    });
};

// admin login
module.exports.login = function(req, res, next){

    debug('Start authentication process');

    var username = req.body.username || '';
    var password = req.body.password || '';

    if(_.isEmpty(username) || _.isEmpty(password)){
        return next(new UnauthorizedAccessError("401", {
            message: 'Invalid username or password'
        }));
    }

    process.nextTick(function() {

        User.findOne(
            {
                username: username
            },
            function (err, user) {

                if (err || !user) {
                    return next(new UnauthorizedAccessError("401", {
                        message: 'Invalid username or password'
                    }));
                }


                user.comparePassword(password, function (err, isMatch) {
                    if (isMatch && !err) {
                        debug("User authenticated, generating token");
                        tokenManager.create(user, req, res, next);
                    }
                    else {
                        return next(new UnauthorizedAccessError("401", {
                            message: 'Invalid username or password'
                        }));
                    }
                });

            }
        );
    });
};

// log admin out
module.exports.logout = function(req, res){

    if(req.user){
        tokenManager.expireToken(req.headers);

        delete req.user;
        return res.send(200);
    }
    else{
        return res.send(401);
    }
};