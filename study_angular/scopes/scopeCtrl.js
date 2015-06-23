/**
 * Created by Administrator on 2015/5/5.
 */

/**
 *  在控制器和试图之间分享数据
 *  在应用的不同部分之间分享数据
 *  广播监听事件
 *  监听数据的变化
 */
var scopeModel = angular.module("scopeModel", []);
/*scopeModel.controller("scopeCtrl", ["$scope", function ($scope) {
    $scope.$watch("full_name", function (newValue, oldValue, scope) {
        if (newValue === oldValue) {//只会在监控器初始化阶段运行
            alert(" 只会在监控器初始化阶段运行");
        } else {
            alert("值发生改变了！");
        }
    });
}]);*/

scopeModel.controller("PhoneDetailCtrl",["$scope",
    function ($scope) {
        $scope.user = "";
        $scope.test = function () {
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.user = "good";
                });
            },2000);
        }
        $scope.test1 = function() {
            $scope.user = 'tank';
        }
        $scope.test1();
        $scope.test();
        console.log($scope);
    }
]);

/*方式一：将本地作用域和DOM中的属性值绑定起来（且这个属性的值必须是父级作用域中的）*/
scopeModel.directive("direct", function () {
    return {
        restrict:"ECMA",
        template: "<div>指令中的：{{name}}</div>",
        scope: {
            name:"@forName"
            //name:"@"
        }
    }
});

scopeModel.controller("nameController",["$scope", function ($scope) {
    $scope.name = "qiansheng";
    $scope.qs = "asfasdfa";
}]);

/*方式2 @是针对字符串而用，但=是针对某个对象的引用*/
scopeModel.directive("direct2", function () {
    return {
        restrict:"ECMA",
        template:"<div>指令中的：{{case.name}}</div>",
        scope: {
            case:"="
        }
    }
});

scopeModel.controller("caseController", ["$scope", function ($scope) {
    $scope.data = [{"name":"张三"},{"name":"李四"}];
}]);

//实现双向数据绑定
scopeModel.directive("direct3",function(){
    return{
        restrict: 'ECMA',
        template: '<div>指令中：<input ng-model="model"/></div>',
        scope:{
            model:'='
        }
    }
});

scopeModel.controller("nameController2",function($scope){
    //$scope.mark="";
})

/*方式3 采用& 对父级作用域进行绑定，并将其中的属性包装成一个函数*/
scopeModel.controller("nameController4",function($scope){
    $scope.title = "标题";
    $scope.contents = [{text:1234},{text:5678}];
});
scopeModel.directive("direct4", function () {
    return {
        restrict: "ECMA",
        template:"<div>{{title}}</div>" + "<div><ul><li ng-repeat='x in contents'>{{x.text}}</li></ul></div>",
        scope: {
            getTitle:"&",
            getContent:"&"
        },
        controller: function($scope,$element,$attrs,$transclude) {
            $scope.title = $scope.getTitle(); //调用无参数
            $scope.contents = $scope.getContent();//调用无参数
        }
    }
});

scopeModel.controller("nameController5",function($scope){
    $scope.showName = function (name) {
        alert(name);
    }
});

scopeModel.directive("direct5", function () {
    return {
        restrict:"ECMA",
        template:"<div><input ng-model='modeldata'/></div>"  + "<div><button class='btn btn-primary' ng-click='show({name:modeldata})'>提示</button></div>",
        scope: {
            show:"&"
        }
    }
});
































