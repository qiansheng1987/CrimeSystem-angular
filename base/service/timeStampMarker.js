/**
 * Created by qs on 2015/5/25.
 */

var interceptorModule = angular.module("baseServiceModule");

interceptorModule.factory("timestampMarker",function () {
    var timestampMarker1 = {
        request: function(config) {
            config.requestTimestamp = new Date().getTime();
            return config;
        },
        response: function (response) {
            response.config.responseTimestamp = new Date().getTime();
            return response;
        }
    };
    return timestampMarker1;
});

/*
interceptorModule.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('timestampMarker');
}]);*/
