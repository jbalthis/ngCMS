/**
 * mongodb_config.js
 */
var mongoose = require('mongoose');

var url = 'mongodb://localhost/app';
var options = {};

var cb = function(err, res){
    if(err) {
        console.log('Connection refused to: ' + url);
        console.log(err);
    }
    else{
        console.log('Connection successful to: ' + url);
    }
};

mongoose.connect(url, options, cb);