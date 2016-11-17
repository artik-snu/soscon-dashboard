'use strict';

angular.module('myApp.about', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/about', {
        templateUrl: '/js/app/templates/about.html',
        controller: 'AboutCtrl'
    });
}])

.controller('AboutCtrl', function($scope, $interval) {
    var chart1 = {};
    chart1.type = "Gauge";
    chart1.cssStyle = "height:400px; width:600px;";

    var options = {
        width: 400, height: 240,
        redFrom: 300, redTo: 340,
        yellowFrom: 250, yellowTo: 300,
        minorTicks: 5,
        max: 340, min: 0
    };
    chart1.options = options;
    chart1.formatters = {};

    $interval(function() {
        var left = 150 + Math.round(180 * Math.random());
        var right = 150 + Math.round(180 * Math.random());
        var data = [
            ['Label', 'Value'],
            ['Left', left],
            ['Right', right],
        ];
        chart1.data = data;
        $scope.chart = chart1;
    }, 1000);
});
