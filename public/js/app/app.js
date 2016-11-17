'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'myApp.rvc',
    'myApp.about',
    'myApp.joystick',
    'myApp.version',
    'firebase',
    'angularAudioRecorder',
    'ngFileUpload',
    'ui.bootstrap',
    'ui.bootstrap.tpls',
    'googlechart'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.otherwise({redirectTo: '/rvc'});
}]);
