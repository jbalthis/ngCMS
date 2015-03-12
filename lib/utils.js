/**
 * lib/utils.js
 */
'use strict';

var debug = require('debug')('app:utils' + process.pid);
var tokenManager = require('../config/token_manager');
var UnauthorizedAccessError = require('../errors/UnauthorizedAccessError');
var _ = require('lodash');


module.exports.middleware = function(){
    var func = function(req, res, next){

        var token  = tokenManager.fetch(req.headers);

        tokenManager.retrieve(token, function(err, data){
            if(err){
                req.user = undefined;
                return next(new UnauthorizedAccessError("invalid_token"));
            }
            else{
                req.user = _.merge(req.user, data);
                next();
            }
        });

    };

    func.unless = require('express-unless');
    return func;

};

debug("Loaded");