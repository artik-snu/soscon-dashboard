var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
http.listen(3000, "0.0.0.0");

// http & html
var index = require('./routes/index');
var api = require('./routes/api');
var chat = require('./routes/chat');
// socket
var chatSocket = require('./routes/chat-socket')(http);

var connected = false;
var powerbot = require('./routes/powerbot');
var bot = powerbot.connect(function() {
    connected = true;
});
var moment = require('moment');
var db = require('./routes/db');
var logRef = db.ref("log");
var logsRef = db.ref("logs");
var resRef = db.ref("reservations");
bot.on('data', function(data) {
    data = data.replace(/\0/g, '');
    var ds = data.split("///");
    for(var i = 0; i < ds.length; i++) {
        data = ds[i];
        if(data.length == 0) continue;
        data = data.replace(/\0/g, '');
        try {
            data = JSON.parse(data);
            logRef.set({
                'timestamp': moment().format(),
                'content': data
            });
            logsRef.child(moment().format('HH:mm:ss-SSS')).set({
                'timestamp': moment().format(),
                'content': data
            });
        } catch(e) {
            console.log('json parsing error', data, e);
        }
    }
});

setInterval(function() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();

    resRef.once('value', function(snapshot) {
        var list = snapshot.val();
        var keys = Object.keys(list);
        console.log(list);
        for(var i = 0; i < keys.length; i++) {
            var l = list[keys[i]];
            var dd = new Date(l.time);

            if(dd.getHours() == h && dd.getMinutes() == m + 1) {
                var type = 0;
                if(l.type == "daily") type = 1;

                var data = {
                    reserve: {
                        on: 1,
                        type: type,
                        hour: dd.getHours(),
                        minute: dd.getMinutes()
                    }
                }

                powerbot.write(bot, data);

                setTimeout(function() {
                    var data = {
                        tts: {
                            text: "잠시 후에 청소가 시작됩니다.",
                            lang: "ko_KR"
                        }
                    }

                    powerbot.write(bot, data);
                }, 10000);
            }
        }
    });
}, 60000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/upload',  express.static(__dirname + '/upload'));

app.use('/', index);
app.use('/api', api);
app.use('/chat', chat);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
