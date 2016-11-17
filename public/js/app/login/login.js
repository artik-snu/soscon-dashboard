'use strict';

angular.module('myApp.login', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: '/js/app/templates/login.html',
        controller: 'LoginCtrl'
    });
}])

.controller('LoginCtrl', function($scope, $interval, $location, $timeout) {
    $scope.correct = {
        username: "soscon",
        password: "12345"
    }
    $scope.form = {
		username: "",
		password: "",
		msg: ""
    }

	$scope.msg = "Log in";
	$scope.disabled = false;
    $scope.submit = function() {
		var form = $scope.form;
		console.log(form);
		if($scope.correct.username === form.username && $scope.correct.password === form.password) {
			$scope.form.msg = "Welcome to SOSCON!";
			$scope.msg = "Loading...";
			$scope.disabled = true;
			$timeout(function() {
				$location.url('rvc')
			}, 1000);
		} else {
			$scope.form.msg = "Check your username and password!";
		}
    }
});
