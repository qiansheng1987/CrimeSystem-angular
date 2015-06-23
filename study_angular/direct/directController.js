/**
 * Created by Administrator on 2015/5/4.
 */
var direct = angular.module("dd",[]);
direct.directive("my-directive", function() {
    return {
        restrict: "E",
        replace:"true",
        scope: {
            myUrl:'@',//绑定策略
            myLingText: '@' //绑定策略
        },
        template: '<a href="{{ myUrl }}">{{ myLinkText }}</a>'
    };
});

direct.run(function($rootScope, $timeout) {
    $timeout(function() {
        $rootScope.myHref = "http://www.baidu.com";
    }, 4000);
});

direct.controller("SomeController",function($scope){
    $scope.someBareValue = "hello computer";
    $scope.someAction = function() {
        $scope.someBareValue = "hello human, from parent";
    };
}).controller("ChildController", function($scope) {
    $scope.childAction = function() {
        $scope.someBareValue = "hello man, from child";
    }
});

direct.controller("EquationController",function($scope) {
    $scope.equation = {};
    $scope.change = function() {
        $scope.equation.output = parseInt($scope.equation.x) + 2;
    }
});

direct.controller('FormController',function($scope) {
        $scope.fields = [
            {placeholder: 'Username', isRequired: true},
            {placeholder: 'Password', isRequired: true},
            {placeholder: 'Email (optional)', isRequired: false}
        ];
        $scope.submitForm = function() {
            alert("it works!");
        };
    });

direct.controller('CityController',function($scope) {
    $scope.cities = [
        {name: 'Seattle'},
        {name: 'San Francisco'},
        {name: 'Chicago'},
        {name: 'New York'},
        {name: 'Boston'}
    ];
});

direct.controller('LotteryController', function($scope) {
        $scope.generateNumber = function() {
            return Math.floor((Math.random()*10)+1);
        };
    });

direct.directive("someDirective", function() {
    return {
        replace: false,
        template:"<div>some stuff</div>"
    }
});


direct.controller('nestedController', function($scope) {
// 可以留空，但需要被定义
});

direct.controller("SecondController",function() {
    //可以留空，但需要被定义
});

/**
 * 注入game服务并调用
 */
direct.controller("MyCtrl",["$scope","$injector",
    function($scope, $injector) {
        $injector.invoke(function (game) {
            console.log(game.gameName);
        });
    }
]);

/**
 * 定义个叫game的服务
 */
direct.factory("game", function () {
    return {
        gameName: "大漠吃豆豆"
    }
});

direct.directive('myDirective', function() {
    return {
        restrict: 'A',
        template: '<div>{{ myProperty }}</div>',
        scope: {}
    };
});

direct.directive('myInheritScopeDirective', function() {
        return {
            restrict: 'A',
            template: '<div>{{ myProperty}}</div>',
            scope: true
        };
    });

































