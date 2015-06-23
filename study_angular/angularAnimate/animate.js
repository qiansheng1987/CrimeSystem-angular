/**
 * Created by Administrator on 2015/5/14.
 */

var animateModule = angular.module("animateModule", ["ngAnimate"]);

animateModule.controller("animateCtrl", ["$scope", function($scope) {
    $scope.showData = function () {
        alert("sdfsf");
    }
}]);