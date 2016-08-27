var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var session = require('express-session');
var multer = require('multer');
//var compression = require('compression');

//var sessionStore = require('express-mysql-session');

var routes = require('./routes/index');
var member = require('./routes/member');
var user = require('./routes/user');
var auth = require('./routes/auth');
var search = require('./routes/search');
var reviews = require('./routes/reviews');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
    dest: './public/uploads/',      //경로 변경 시켜야 함
    rename : function(fieldname, filename) {
        return 'image'+Date.now();
    }
}));

/*var options = {
    host : 'localhost',
    port : 3306,
    user : 'root',
    password : 'raviewme5',
    database : 'raview',
    useConnectionPooling : true

};

app.use(session({
    store : new sessionStore(options),
    secret: 'cats',
    resave: true,
    saveUninitialized: true
}))
*/
// production error handler
// no stacktraces leaked to user

// error handlers

// development error handler
// will print stacktrace

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use('/auth', auth);
app.use('/', routes);
app.use('/member', member);
app.use('/user', user);
app.use('/reviews', reviews);
app.use('/search', search);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var Iconv = require('iconv').Iconv;

var http = require('http');
var https = require('https');
var fs = require('fs');
/*
var options = {
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./server.crt', 'utf8')
}
*/
var port80 = 80;
//var port443 = 443;


http.createServer(app).listen(port80, function() {
    console.log('HTTP server listening on port'+ port80);
});
/*
https.createServer(options, app).listen(port443, function() {
    console.log('HTTPS server listening on port'+ port443);
});
*/
module.exports = app;
