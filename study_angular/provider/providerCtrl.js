/**
 * Created by Administrator on 2015/5/5.
 */

/**
 *provider/factory/service/constant/value
 * provider事基础，其余都是调用provider函数实现的，只是参数不同，从左到右，灵活性越来越差。
 * 策略模式
 */


var providerModel = angular.module("providerModel", []);

/**
 * 定义一个helloAngular Provider
 */
providerModel.provider("HelloAngular", function () {
    return {
        $get: function() {
            var name = "qiansheng ceshi";
            function getName() {
                return name;
            }
            return {
                getName:getName
            }
        }
    }
});


providerModel.factory("HelloAngular2", function () {
    var name = "qiansheng ceshi2";
    function getName() {
        return name;
    }
    return {
        getName:getName
    }
});

providerModel.service("HelloAngular3", function () {
    this.name = "qiansheng ceshi3";
    this.getName = function () {
        return this.name;
    }
});

providerModel.controller("providerCtrl", ["$scope", "HelloAngular",
    function ($scope, helloAngular) {
        $scope.getName = helloAngular.getName();
    }
]);





































