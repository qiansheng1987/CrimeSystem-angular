/**
 * Created by qs on 2015/5/5.
 * www.html-js.com/article/1863
 */

/**
 *
 * $emit只能想parent controller传递event与data
 * $broadcast只能向child controller传递event与data
 * $on用于接受event与data
 */
var eventModel = angular.module("eventModel", []);

eventModel.controller("SelfCtrl", ["$scope", function ($scope) {
    $scope.click = function () {
        var data = [
            {name:"lilei",sex:"nan"},
            {name:"hanmeimei",sex:"nv"}
        ];
        $scope.$broadcast("to-child", data);
        $scope.$emit("to-parent", data);
    }
}]);

eventModel.controller("ParentCtrl", ["$scope", function ($scope) {
    $scope.$on("to-parent", function (event, data) {
        console.log("ParentCtrl",angular.toJson(data)); //父级能得到值
    });
    $scope.$on("to-child", function (event, data) {
        console.log("ParentCtrl", angular.toJson(data)); //子级得不到值
    });
}]);

eventModel.controller("BroCtrl", ["$scope", function ($scope) {

}]);










































