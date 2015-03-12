/**
 * file: models/User.js
 * desc: User Schema and Model
 * author: Jason Balthis
 * email: jason.balthis@gmail.com
 */
"use strict";
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

// create the User Schema
var UserSchema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        created: { type: Date, default: Date.now() }
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

UserSchema.pre('save', function(next){
    var user = this;
    if(user.isModified('password') || user.isNew){
        bcrypt.genSalt(10, function(err, salt){
            if(err){ return next(err); }

            bcrypt.hash(user.password, salt, function(err, hash){
                if(err){ return next(err); }
                user.password = hash;
                next();
            });
        });
    }
    else{
        return next();
    }
});

UserSchema.methods.comparePassword = function(password, cb){
    bcrypt.compare(password, this.password, function(err, isMatch){
        if(err){ return cb(err); }
        cb(null, isMatch);
    });
};

// export model
module.exports = mongoose.model('User', UserSchema);