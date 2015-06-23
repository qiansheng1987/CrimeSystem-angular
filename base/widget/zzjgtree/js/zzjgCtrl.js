/**
 * Created by YP on 2015-04-16.
 */
var ezcrime = angular.module("ezcrime");
ezcrime.controller( 'ZzjgController', ['$scope', function($scope){
    $scope.zzjgData = ezcrimeConfig.zzjgData;
    alert("这是控制器");
}]);
