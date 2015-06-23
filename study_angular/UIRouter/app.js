/**
 * Created by qs on 2015/5/26.
 */


angular.module("formApp",["ngAnimate", "ui.router"])

.run([ '$rootScope', '$state', '$stateParams','$location','Auth1', function ($rootScope, $state, $stateParams,$location, Auth1) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    //给$routerChangeStart设置监听
    /*$rootScope.$on("$routeChangeStart", function (evt, next, cur) {
        alert("竟来了");
        if (!Auth1.isLoginedIn()) {
            alert("没有登陆");
            $location.path("/login");
        } else {
            alert("用户已经登陆");
        }
    });*/

}])

//configuring our routes
.config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state("form",{
                url: "/form",
                templateUrl: "form.html",
                controller: "formController"
            })
            //nested states
            .state("form.profile",{
                url:"/profile",
                templateUrl:"form-profile.html"
            })
            // url will be /form/interests
            .state('form.interests', {
                url: '/interests',
                templateUrl: 'form-interests.html'
            })

            // url will be /form/payment
            .state('form.payment', {
                url: '/payment',
                templateUrl: 'form-payment.html'
            });
        // catch all route
        // send users to the form page
        $urlRouterProvider.otherwise('/form/profile');
    })

.controller("formController", function ($scope) {
        $scope.formData = {};
        $scope.processForm = function () {
            alert("awesome!");
        }
    })
    .factory("Auth1",function () {

    var _user = sessionStorage.getItem("user");
    var setUser = function (user) {
        _user = user;
        sessionStorage.setItem("user", _user);
    }

    return {
        setUser:setUser,
        isLoginedIn: function() {
            return _user ? true : false;
        },
        getUser: function() {
            return _user;
        },
        getToken: function() {
            return _user ? _user.token : "";
        },
        logout: function() {
            sessionStorage.remove("user");
            _user = null;
        }
    }

});








































