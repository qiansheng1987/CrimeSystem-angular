/**
 * Created by YP on 2015-04-21.
 */
var loginModule = angular.module('loginModule', ['baseServiceModule']);
loginModule.controller( 'LoginController', ['$scope', '$state',"$element","$attrs","$transclude",'serviceFactory','Auth',
    function ($scope, $state,$element, $attrs,$transclude,serviceFactory, Auth) {

    console.log('loginModule --> LoginController 定义');

    //$scope.user = { userName: 'jq', password: '' };
    $scope.user = { userName: '', password: '' };

    loginForm.loginSuccess = false;

    $scope.loginValidate = function ($error) {
        jsonstr={opid:'login',params:{'pass':$scope.user.password,'userid':$scope.user.userName}};
        console.log($scope.loginForm);
        serviceFactory.getDataListByRest(_angular_clientUrl+ "/CrossDomainProxy?requestURL=http://172.18.68.81:7001/CrimeService_new/LoginServlet?jsonstr=" + angular.toJson(jsonstr))
            .success(function (data, status, headers, config) {
                if(data.success && data.resultJson != 'false' ){
                    Auth.setUser();
                    var userInfo = angular.toJson(data);
                    console.log("userInfo:" + userInfo);
                    sessionStorage.setItem("currentUser", $scope.user.userName);
                    $state.go( 'home' );

                }else{
                    console.log("config:" + angular.toJson(config));
                    $("#showTip").attr("hidden", false);
                    $("#showTip").html("用户名或密码错误");
                    $scope.loginForm.password.passwordGroupValidate = true;
                    $scope.loginForm.userName.userNameValidate = true;
                }

            }).error(function(data, status, headers, config) {
                $scope.loginForm.userName.userNameValidate = true;
                $scope.loginForm.password.passwordGroupValidate = true;
            })
    };

    $scope.changeHandler = function (type) {
        if (type == "username") {
            $scope.loginForm.userName.userNameValidate = false;

        }
        if (type == "password") {
            $scope.loginForm.password.passwordGroupValidate = false;
        }
    };
}]);


loginModule.directive("login", ["$location", function ($location) {
    return {
        restrict: "E",
        replace: true,
        controller:"LoginController",
        templateUrl: 'login/tpls/loginDirect.html',
        link: function (scope, element, attrs) {
            $("#showTip").attr("hidden", true);
        }
    }
}]);
