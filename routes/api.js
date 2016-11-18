var express = require('express');
var router = express.Router();
var moment = require('moment');
var FCM = require('fcm-push');
var serverKey = 'AIzaSyDA1sLjFirkVcWTJTsbXsNIYVN4C7hj_YU';
var fcm = new FCM(serverKey);
var dtoken = "fFFbTjMQtHI:APA91bFxwp4iPuNUSbq60cdYgr8-j2cyis7j64d7_i_pjmAiMBKnRUJbffV1-vHgGMlJDCrPjwRcnS2ZeSPCyj5G4B8m-i-MZrcNLT_JVhiN8sMfORdtSoDK_8a5gW_Low_lstAdnD6e";

// firebase
var db = require('./db');
var resRef = db.ref("reservations");
var ttsRef = db.ref("tts");
var imgRef = db.ref("img");
var powerbot = require('./powerbot');
// end firebase
var fs = require('fs');

var cmds = {
	tts: {tts: {
		text: "",
		lang: ""
	}},
	wav_play: {wav_play: {
		url: ""
	}},
    left: {control: 2},
    forward: {control: 1},
    right: {control: 3},
    wheel_vel: {wheel_vel: {
        left: 0,
        right: 0
    }},
    lin_ang_vel: {lin_ang_vel: {
        lin: 0,
        ang: 0
    }},
    time: {time: {
        hour: 0,
        minute: 0
    }},
    reserve_once: {reserve: {
        type: 0,
        on: 1,
        hour: 0,
        minute: 0
    }},
    reserve_daily: {reserve: {
        type: 1,
        on: 1,
        hour: 0,
        minute: 0
    }},
    cancel_once: {reserve: {
        type: 0,
        on: 0,
        hour: 0,
        minute: 0
    }},
    cancel_daily: {reserve: {
        type: 1,
        on: 0,
        hour: 0,
        minute: 0
    }},
    mute: {voice: 1},
    beep: {voice: 0},
    silent: {suction: 1},
    normal: {suction: 2},
    turbo: {suction: 3},
    auto: {mode: 15},
    spot: {mode: 37},
    homing: {mode: 13},
    stop: {mode: 5}
    };

/* GET api listing. */
router.get('/', function(req, res, next) {
    res.send('test');
});

router.get('/controller', function(req, res, next) {
    var lin = parseFloat(req.param('lin'));
    var ang = parseFloat(req.param('ang'));
    var data = {lin_ang_vel: {
        lin: lin,
        ang: ang
    }};

    console.log(data);

    var bot = powerbot.get();
    powerbot.write(bot, data);

    res.json({});
});

router.post('/reservation', function(req, res, next) {
	resRef.push().set(req.body.reservation);

    var bot = powerbot.get();

	var d = new Date();
	var time = {time: {
		hour: d.getHours(),
		minute: d.getMinutes()
	}}
    powerbot.write(bot, time);

    res.json({succes: true});
});

router.delete('/reservation/:id', function(req, res, next) {
	var id = req.param('id');
	resRef.child(id).remove();
    res.json({succes: true});
});

var multer = require('multer');
var Q = require("q");
var imgPath = "upload/img";
var imgUpload = function (req, res) {
	var deferred = Q.defer();

	var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, imgPath)
		},
		filename: function (req, file, cb) {
			cb(null, Date.now() + "-" + file.originalname);
		}
	})
	var upload = multer({ storage: storage }).single('file');

	upload(req, res, function (err) {
		if (err) deferred.reject();
		else deferred.resolve(req.file);
	});
	return deferred.promise;
};
var uploadPath = "upload/wav";
var upload = function (req, res) {
	var deferred = Q.defer();

	var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, uploadPath)
		},
		filename: function (req, file, cb) {
			cb(null, Date.now() + "-" + file.originalname);
		}
	})
	var upload = multer({ storage: storage }).single('file');

	upload(req, res, function (err) {
		if (err) deferred.reject();
		else deferred.resolve(req.file);
	});
	return deferred.promise;
};

router.post('/upload', function(req, res, next) {
    upload(req, res).then(function (file) {
        var exec = require('child_process').exec;
        var cmd = 'gst-launch-1.0 -v filesrc location="upload/wav/' + file.filename + '" ! wavparse ! audioconvert !  rtpL16pay  ! udpsink host=192.168.0.8 port=5050';
		console.log(cmd);
        exec(cmd, function(error, stdout, stderr) {
            console.log('streaming');
        });
        var msg = "녹음된 음성을 재생합니다.";
        ttsRef.push().set({
            content: msg,
            time: moment().format()
        })
        res.json(file);
    }, function (err) {
		res.send(500, err);
	});
});

function tts(msg) {
	var data = {tts: {
		text: msg
	}};

	ttsRef.push().set({
		content: msg,
		time: moment().format()
	})

	setTimeout(function() {
		var bot = powerbot.get();
		powerbot.write(bot, data);
	}, 500);
}

router.post('/detect', function(req, res, next) {
	//var url = "/upload/img/1479416085768-alarm.jpg";
	//imgRef.push().set({time: moment().format(), url});
	//res.json({});
	//return;
    imgUpload(req, res).then(function (file) {
		var url = "/upload/img/" + file.filename;
		imgRef.push().set({time: moment().format(), url});
        res.json({});
    }, function (err) {
		res.send(500, err);
	});
    res.json({});
});

router.get('/alarm', function(req, res, next) {
	var data = {alarm_play: ""};
    var bot = powerbot.get();
    powerbot.write(bot, data);

    var message = {
        to: dtoken, // required fill with device token or topics
        collapse_key: "" + parseInt(Math.random() * 10000), 
        data: {
        },
        notification: {
            sound: "default",
            title: 'SOSCON',
            body: '침입자가 감지되었습니다. 청소기의 카메라로 확인하세요.'
        }
    };

    //callback style
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!", response);
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });

    res.json({});
});

router.get('/logs', function(req, res, next) {
    ttsRef.push().set({
        content: req.param('text'),
        time: moment().format()
    })
    res.json({});
})

router.get('/cmd', function(req, res, next) {
    var cmd = req.param('cmd');
    var data = cmds[cmd];

    if(cmd == "wheel_vel") {
        data[cmd].left = parseFloat(req.param('left'));
        data[cmd].right = parseFloat(req.param('right'));
    }
    else if(cmd == "lin_ang_vel") {
        data[cmd].lin = parseFloat(req.param('lin'));
        data[cmd].ang = parseFloat(req.param('ang'));
    }
    else if(cmd == "time") {
        data[cmd].hour = parseInt(req.param('hour'));
        data[cmd].minute = parseInt(req.param('minute'));
    }
    else if(cmd == "reserve_once") {
        data['reserve'].hour = parseInt(req.param('hour'));
        data['reserve'].minute = parseInt(req.param('minute'));
    }
    else if(cmd == "reserve_daily") {
        data['reserve'].hour = parseInt(req.param('hour'));
        data['reserve'].minute = parseInt(req.param('minute'));
    }
	else if(cmd == "wav_play") {
		url = "http://192.168.0.3:3000/upload/wav/1479314787771-record.wav";
		//req.param('url');
        data[cmd].url = url;
	}
    else if(cmd == "tts") {
        data[cmd].text = req.param('text');
        data[cmd].lang = req.param('lang');

		ttsRef.push().set({
			content: req.param('text'),
            time: moment().format()
		})
    }

    var bot = powerbot.get();
    powerbot.write(bot, data);

	if(cmd == "mute") {
		tts("음소거 모드");
	}
	else if(cmd == "auto") {
		tts("청소를 시작합니다.");
	}
	else if(cmd == "stop") {
		tts("청소를 중지합니다.");
	}
	else if(cmd == "homing") {
		tts("배터리 충전을 위해 귀환합니다.");
	}
	else if(cmd == "silent") {
		tts("저소음 청소 모드로 전환합니다.");
	}
	else if(cmd == "normal") {
		tts("일반 청소 모드로 전환합니다.");
	}
	else if(cmd == "turbo") {
		tts("터보 청소 모드로 전환합니다.");
	}

    res.send(data);
});

function randint(size) {
	return Math.floor(Math.random() * size);
}

module.exports = router;
