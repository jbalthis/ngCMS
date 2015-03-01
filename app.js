var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');

var tokenManager = require('./config/token_manager');
var secret = require('./config/secret').__SECRET_TOKEN__;
var db = require('./config/mongodb_config');

// init app
var app = express();
app.listen(3001);
app.use(logger());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// static/public directory setup
app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// init routing
var routes = {};
routes.posts = require('./routes/posts');
routes.users = require('./routes/users');
routes.metrics = require('./routes/metrics');

// setup our response headers
app.all('*', function(res, req, next){
    res.set('Access-Control-Allow-Origin', 'http://localhost');
    res.set('Access-Control-Allow-Credentials', true);
    res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    if('OPTIONS' == req.method) return res.status(200);
    next();
});



app.get('/post', routes.posts.list);






// ============= //
// Error Handles //
// ============= //

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// Export the app as a module
module.exports = app;

// EOF