/**
 * file: app.js
 * desc: main application init
 */
'use strict';
var debug = require('debug')('app:' + process.pid);
var path = require('path');
var fs = require('fs');
var http_port = process.env.HTTP_PORT || 3001;
var https_port = process.env.HTTPS_PORT || 3443;
var jwt = require('express-jwt');
var secret = require('./config/secret').SECRET_TOKEN;
var mongoose_uri = require('./config/mongodb_conf').MONGOOSE_URI;
var onFinished = require('on-finished');
var unless = require('express-unless');
var NotFoundError = require('./errors/NotFoundError');
var utils = require('./lib/utils');
var public_dir = path.join(__dirname, 'public');


debug('Starting Application');

// mongoose init
debug('Loading Mongoose/MongoDB connection');
var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(mongoose_uri);
mongoose.connection.on('error', function(){
    debug('Mongoose connection to MongoDB error');
});
mongoose.connection.once('open', function(){
    debug('Mongoose successfully connected to MongoDB');
});


// express init
debug('Initializing Express');
var express = require('express');
var app = express();

// add middleware plugins
debug('Attaching plugins');

// favicon support
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/favicon.ico'));

// configure logging to stdout and file
var morgan = require('morgan');
app.use(morgan('dev'));
var accessLogStream = fs.createWriteStream(__dirname + '/logs/access.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// POST request parsing
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var responseTime = require('response-time');
app.use(responseTime);
var compression = require('compression');
app.use(compression);

// static/public directory setup
app.use(express.static(public_dir));

app.use(function(req, res, next){
    onFinished(res, function(err){
       debug("[%s] finished request", req.connection.remoteAddress);
    });
    next();
});

var jwtCheck = jwt({
   secret: secret
});
jwtCheck.unless = unless;

app.use(jwtCheck.unless({ path: '/user/login' }));
app.use(utils.middleware().unless({ path: '/user/login'}));

var routes = {};
routes.posts = require('./routes/posts');
routes.users = require('./routes/users');
routes.metrics = require('./routes/metrics');
app.post('/user/login', routes.users.login);

//// setup our response headers
//app.all('*', function(res, req, next){
//    res.header('Access-Control-Allow-Origin', 'http://localhost');
//    res.header('Access-Control-Allow-Credentials', true);
//    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
//    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
//    if('OPTIONS' == req.method) return res.status(200);
//    next();
//});




app.get('/post/create', routes.posts.create);
app.post('/post/update', routes.posts.update);
app.get('/post/delete', routes.posts.delete);
app.get('/posts', routes.posts.list);
app.get('/posts/all', routes.posts.listAll);
app.get('/posts/by-tag', routes.posts.listByTag);
app.post('/post/read', routes.posts.read);
app.post('/post/like', routes.posts.like);
app.post('/post/unlike', routes.posts.unlike);

app.post('/user/register', routes.users.register);
app.post('/user/login', routes.users.login);
app.post('/user/logout', routes.users.logout);

app.get('/metrics/page-views', routes.metrics.showPageViews);

// error handling
app.use(function(err, req, res, next){

    var errorType = typeof err,
        code = 500,
        msg = { message: "Internal Server Error" };

    switch(err.name){
        case "UnauthorizedError":
            code = err.status;
            msg = undefined;
            break;
        case "BadRequestError":
        case "UnauthorizedAccessError":
        case "NotFoundError":
            code = err.status;
            msg = err.inner;
            break;
        default:
            break;
    }

    return res.status(code).json(msg);
});


// server creation
debug("Creating HTTP server on port: %s", http_port);
require('http').createServer(app).listen(http_port, function(){
    debug("HTTP Server listening on port: %s, in %s mode", http_port, app.get('env'));
});

debug("Creating HTTPS server on port: %s", https_port);
require('https').createServer({
    key: fs.readFileSync(path.join(__dirname, "keys", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "keys", "server.crt")),
    ca: fs.readFileSync(path.join(__dirname, "keys", "ca.crt")),
    requestCert: true,
    rejectUnauthorized: false
}, app).listen(https_port, function(){
    debug("HTTPS Server listening on port: %s, in %s mode", https_port, app.get('env'));
});


// Export the app as a module
module.exports = app;

// EOF