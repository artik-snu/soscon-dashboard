'use strict';

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

angular.module('myApp.rvc', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/rvc', {
        templateUrl: 'js/app/templates/rvc.html',
        controller: 'RVCCtrl'
    });
}])

.controller('RVCCtrl', function($scope, $firebaseObject, $firebaseArray, $http, Upload, $uibModal, $log, $document, MyFirebase, $rootScope, $timeout, $interval) {
    $scope.$on('$viewContentLoaded', function() {
        waitingDialog.show('Connecting...');
        $timeout(function() {
            $scope.connectCCTV();
        }, 1000);
    });
	$scope.init = function() {
		//var context = document.getElementById('demo').getContext('2d');
		//Game.run(context);
	}
    $scope.$on('$routeChangeSuccess', function() {
        console.log('page loaded');
        if ($('[data-toggle="select"]').length) {
            $('[data-toggle="select"]').select2();
        }
        if ($('[data-toggle="switch"]').length) {
            //$('[data-toggle="switch"]').bootstrapSwitch();
        }
        $timeout(function() {
            $scope.init();
            $scope.loadChart();
        }, 500);
        $timeout(function() {
            $scope.tts("청소기에 연결되었습니다.");
        }, 1000);
    });

    $scope.loadChart = function() {
        var chart1 = {};
        chart1.type = "Gauge";
        chart1.cssStyle = "width: 170px; height:170px;";

        var options = {
            width: 170, height: 170,
            redFrom: 300, redTo: 350,
            yellowFrom: 250, yellowTo: 300,
            minorTicks: 5,
            max: 350, min: 0
        };
        chart1.options = options;
        chart1.formatters = {};

        $interval(function() {
            var left = Math.abs($scope.status.wheel.left);
            var right = Math.abs($scope.status.wheel.right);
            var linear = Math.abs($scope.status.lin_ang_vel.lin);
            var data = [
                ['Label', 'Value'],
             //   ['Left', left],
             //   ['Right', right],
                ['Linear', linear],
            ];
            chart1.data = data;
            $scope.chart = chart1;

			//var dig = Math.degrees($scope.status.pose.q);
			var dig = Math.degrees($scope.status.lin_ang_vel.ang);
			var compassDisc = document.getElementById("arrowImg");
			compassDisc.style.webkitTransform = "rotate("+ dig +"deg)";
			compassDisc.style.MozTransform = "rotate("+ dig +"deg)";
			compassDisc.style.transform = "rotate("+ dig +"deg)";
        }, 300);
    };

    $scope.moveTo = function(x, y) {
        //Game.moveTo(x, y);
    }

    $scope.enabled = false;
    $scope.enableVideo = function() {
        $scope.enabled = true;
        detectEmotion();
    }
    $scope.detect = function() {
        startVideo();
    }

    $scope.showVideo = false;

	$scope.sendLog = function(msg) {
		$http({
			method: 'GET',
            url: '/api/logs?text=' + msg
		}).then(function successCallback(response) {
			console.log('commanded', response);
		}, function errorCallback(response) {
			console.log('failure', response);
		});
	}

	$scope.tts = function(msg, lang) {
        if(lang == undefined) lang = "ko_KR";
		$http({
			method: 'GET',
            url: '/api/cmd?cmd=tts&text=' + msg + "&lang=" + lang
		}).then(function successCallback(response) {
			console.log('commanded', response);
		}, function errorCallback(response) {
			console.log('failure', response);
		});
	}

    $scope.imgUrl = "";
    $scope.showWarning = function(img) {
        $scope.imgUrl = img.url;
    }
    $scope.clearWarning = function(img) {
        $scope.imgUrl = "";
    }

    var KEY = "log";//powerbot/test-table";
    var db = firebase.database();
    $scope.doptions = {notify: true, detect: true};
    var first = true;
    db.ref("img").limitToLast(1).on('child_added', function(snapshot) {
        if(first) {
            first = false;
        } else {
            console.log("detect", snapshot.val());
            var img = snapshot.val();
            if($scope.doptions.notify || $scope.doptions.detect) {
				$scope.sendLog("이상 물체가 감지되었습니다.");
			}
            if($scope.doptions.notify) {
                $http({
                    method: 'GET',
                    url: '/api/alarm'
                }).then(function successCallback(response) {
                    console.log('commanded', response);
                }, function errorCallback(response) {
                    console.log('failure', response);
                });
            }
            if($scope.doptions.detect) {
                $scope.showWarning(img);
            }
        }
    });
    db.ref(KEY).on('value', function(snapshot) {
        waitingDialog.hide();

        var content = snapshot.val().content; // _pos.q
        $scope.content = content;
        var pose = content.pose;
        var wheel = content.wheel_vel;
        var battery = content.battery;
        var lin_ang_vel = content.lin_ang_vel;
        var lift = content.lift;
        var cliff = content.cliff;
        var bumper = content.bumper;

        $scope.ts = snapshot.val().timestamp;
        $scope.moveTo(pose.x, pose.y);
        $scope.status = {
            wheel: wheel,
            lift: lift,
            cliff: cliff,
            bumper: bumper,
            battery: battery * 33,
            lin_ang_vel: lin_ang_vel,
            pose: pose
        }
        $timeout(function() {
            $scope.$apply();
        }, 300);
    });
    db.ref("preMap").on('value', function(snapshot) {
        var ix = $scope.status.pose.x;
        var iy = $scope.status.pose.y;
        var preMap = snapshot.val();
        var maxx = preMap.maxx;
        var maxy = preMap.maxy;
        var minx = preMap.minx;
        var miny = preMap.miny;
        var imap = preMap.map;
        //console.log(imap);
        
        console.log(maxx, maxy, minx, miny);
        PowerbotMap.run(ix, iy, imap);
    });

    $scope.message = {lang: "ko_KR"};
    $scope.sendMessage = function() {
        $scope.tts($scope.message.text, $scope.message.lang);
        $scope.message.text = "";
    }

    $scope.saveMap = function() {
        var imap_value = [];
        imap_value = PowerbotMap.mvalue;
        console.log(imap_value);
        db.ref("preMap").update({'map': imap_value});
        $scope.tts("생성한 지도를 저장했습니다.");
    }

	$scope.reservations = [];
    db.ref("reservations").on('value', function(snapshot) {
		console.log(snapshot.val());
        $scope.reservations = snapshot.val();
		console.log($scope.reservations);
		$rootScope.$broadcast('reservations:update', $scope.reservations);
		MyFirebase.data.reservations = $scope.reservations;
    });
    db.ref("powerbot/test-table/cmd").on('value', function(snapshot) {
        $scope.cmd = snapshot.val();
    });

    $scope.status = {
        wheel: {
            left: 0,
            right: 0
        },
        lin_ang_vel: {
            lin: 0,
            ang: 0
        },
        lift: {
            left: 0,
            right: 0
        },
        bumper: {
            left: 0,
            right: 0
        },
        cliff: {
            center: 0,
            left: 0,
            right: 0
        },
        battery: 20
    }
    $scope.cmd = {
        clean: false,
        video: false,
        sound: false
    }
    $scope.logs = [];
    db.ref("tts").on('value', function(snapshot) {
        var logs = snapshot.val();
        var keys = Object.keys(logs);
        $scope.logs = [];
        for(var i = keys.length - 1; i >= 0; i--) {
            $scope.logs.push(logs[keys[i]]);
        }
        //console.log("logs", $scope.logs);
        $scope.$apply();
    });

    $scope.connectCCTV = function() {
        $scope.cctv = new CCTV();
        $scope.cctv.init();
        $scope.cctv.start();
    }

    $scope.startStream = function() {
        $scope.showVideo = true;
        $scope.cctv.startStream();
        $('.vjs-play-control').click();
        $scope.tts("카메라 녹화를 시작합니다.");
    }
    $scope.stopStream = function() {
        $scope.showVideo = false;
        $scope.cctv.stopStream();
        $scope.tts("카메라 녹화를 중지합니다.");
    }
	$scope.reservations = {};

    function blobToFile(theBlob, fileName){
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return theBlob;
    }

    $scope.recordedInput = null;
    $scope.saveAudio = function() {
        $timeout(function() {
            var blob = $scope.recordedInput;
            var name = "record";
            var ext = ".wav";
            var filename = name + ext;
            var file = new File([blob], filename)

            Upload.upload({
                url: '/api/upload',
                data: {
                    file: file,
                    'filename': filename,
                    'name': name,
                    'ext': ext
                }
            }).then(function (resp) {
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
            }, function (resp) {
                console.log('Error status: ' + resp.status);
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
        }, 500);
    }

	$scope.openReservation = function (size, parentSelector) {
		var parentElem = parentSelector ? 
			angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
		var modalInstance = $uibModal.open({
			animation: $scope.animationsEnabled,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'js/app/templates/reservation.html',
			controller: 'ReservationCtrl',
			size: size,
			appendTo: parentElem
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

    $scope.execute = function(cmd) {
        if(cmd == "reservation") {
			$scope.openReservation('lg');
        }
        else {
            $http({
                method: 'GET',
                url: '/api/cmd?cmd=' + cmd
            }).then(function successCallback(response) {
                console.log('commanded', response);
            }, function errorCallback(response) {
                console.log('failure', response);
            });
        }
    }
})
.controller('ReservationCtrl', function ($uibModalInstance, $http, MyFirebase, $scope, $rootScope, $timeout) {
	$scope.disabled = {
		form: false
	}
	$scope.refine = function(ts) {
		if(ts == undefined) return {};
		var keys = Object.keys(ts);
		for(var i = 0; i < keys.length; i++) {
			ts[keys[i]].rtime = ts[keys[i]].time;
			ts[keys[i]].time = new Date(ts[keys[i]].time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
		}
		return ts;
	}

	$scope.reservations = $scope.refine(MyFirebase.data.reservations);
	$scope.has_reservations = (Object.keys($scope.reservations).length > 0);
	$rootScope.$on('reservations:update', function(event, reservations) {
	//$scope.$watch('MyFirebase.data.reservations', function() {
		$scope.reservations = $scope.refine(reservations);
		$scope.has_reservations = (Object.keys($scope.reservations).length > 0);
		$scope.disabled.form = false;
		$timeout(function() {
            $scope.$apply();
        }, 300);
	});

	var d = new Date();
	$scope.form = {
		time: new Date(2016, 10, 17, d.getHours(), d.getMinutes()),
		type: "daily"
	};

	$scope.create = function() {
		$scope.disabled.form = true;
		var tmpForm = $scope.form;
		tmpForm.status = 0;
		$http({
			method: 'POST',
			url: '/api/reservation',
			data: {
				reservation: tmpForm
			}
		}).then(function successCallback(response) {
			var d = new Date(tmpForm.time);
			$scope.form = {
				time: new Date(2016, 10, 17, d.getHours(), d.getMinutes()),
				type: "daily"
			}
			console.log('commanded', response);
			$scope.tts(d.getHours() + "시 " + d.getMinutes() + "분 청소가 예약되었습니다.");
		}, function errorCallback(response) {
			console.log('failure', response);
			$scope.disabled.form = false;
		});
	};

	$scope.tts = function(msg) {
		$timeout(function() {
			$http({
				method: 'GET',
				url: '/api/cmd?cmd=tts&text=' + msg
			}).then(function successCallback(response) {
				console.log('commanded', response);
			}, function errorCallback(response) {
				console.log('failure', response);
			});
		}, 1000);
	}

	$scope.cancel = function(id) {
		console.log($scope.reservations[id].rtime);
		var d = new Date($scope.reservations[id].rtime);
		var msg = d.getHours() + "시 " + d.getMinutes() + "분으로 예정된 청소를 취소합니다.";
		$http({
			method: 'DELETE',
			url: '/api/reservation/' + id + "?type=" + $scope.reservations[id].type
		}).then(function successCallback(response) {
			$scope.tts(msg);
			console.log('commanded', response);
		}, function errorCallback(response) {
			console.log('failure', response);
		});
	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};
})
.service('MyFirebase', function () {
    var config = {
        apiKey: "AIzaSyCWCHVrlW3pK_0Vx_EU6fFEdUY8LlGDRR4",
        authDomain: "soscon-96a4b.firebaseapp.com",
        databaseURL: "https://soscon-96a4b.firebaseio.com",
        storageBucket: "soscon-96a4b.appspot.com",
        messagingSenderId: "993895884168"
    };
    firebase.initializeApp(config);
	this.data = {};
	this.data.reservations = {};
})
.filter('status2str', function() {
	return function(input) {
		var result = "Not yet";
		if(input == 1) {
			result = "finished";
		}
		return result;
	};
})
.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})
.filter('t2kr', function() {
    return function(input) {
        var time = new Date(input).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        return time;
    }
})
;
