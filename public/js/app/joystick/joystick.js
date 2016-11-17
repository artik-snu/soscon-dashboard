'use strict';

angular.module('myApp.joystick', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/joystick', {
        templateUrl: '/js/app/templates/joystick.html',
        controller: 'JoystickCtrl'
    });
}])

.controller('JoystickCtrl', function($http, $scope, $interval) {
    $scope.$on('$viewContentLoaded', function() {
        var joystick    = new VirtualJoystick({
            container   : document.getElementById('joystick-container'),
            mouseSupport    : true,
        });
        var height = window.innerHeight;
        var width = window.innerWidth;
        var r = 0.0;
        var maxLin = 340.0;

        console.log(r, height, width);
        if(height > width) r = width / 2;
        else r = height / 2;

        joystick.addEventListener('touchStart', function(){
            console.log('down')
        })
        joystick.addEventListener('touchEnd', function(){
            console.log('up')
        })

        var LIN = 0.0;
        var ANG = 0.0;

        var socket = io();
        socket.on('log', function(data) {
            //console.log('log', data);
        });

        $interval(function(){
            var dx = joystick.deltaX();
            var dy = joystick.deltaY();

            if(dx == 0 && dy == 0) return;

            var ang = Math.atan2(dy, dx);
            var lin = maxLin;

            var dr = Math.sqrt(dx * dx + dy * dy);
            if(dr < r) lin = maxLin * dr / r;

            lin = (maxLin * Math.pow(Math.abs(dy), 1.3) / Math.pow((height / 2), 1.3));
            if(dy > 0) lin *= -1;
            ang = 3.14 * dx / (width / 2);
            ang *= -1;

            LIN = lin;
            ANG = ang;
            console.log(lin, ang);

            socket.emit('move', {lin: lin, ang: ang});
            //$http({
            //    method: 'GET',
            //    url: "/api/controller?lin=" + lin + "&ang=" + ang
            //});
        }, 1000);

        $interval(function() {
            var dx = joystick.deltaX();
            var dy = joystick.deltaY();
            var outputEl    = document.getElementById('result');

            outputEl.innerHTML  = '<b>Result:</b> '
            + ' dx:'+dx
            + ' dy:'+dy
            + ' <br>lin:'+LIN
            + ' ang:'+ANG
            + (joystick.right() ? ' right'  : '')
            + (joystick.up()    ? ' up'     : '')
            + (joystick.left()  ? ' left'   : '')
            + (joystick.down()  ? ' down'   : '')   
        }, 1/30 * 1000);
    });
});
