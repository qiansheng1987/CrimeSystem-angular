/**
 * 犯罪分析系统入口
 * Created by YP on 2015-04-23.
 */

/*
 * 全局对象，用于保存一些全局数据，如警情类别代码、组织机构树等
 * */
var ezCrimeData = {};

var ezcrime = angular.module('ezcrime', ['ui.router', 'baseServiceModule', 'loginModule','ez.jqQueryModule',
    "ez.components", 'mapApp', 'ez.genealogy', 'ez.personModule','ez.personQueryModular','ez.ajQueryModule']);

ezcrime.run(['$rootScope', '$state', '$stateParams', '$location', 'Auth','baseDataService','mapService',
    function ($rootScope, $state, $stateParams, $location, Auth,baseDataService,mapService) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    var jqlb = [];

    $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            if (toState.name == "login") { //是登陆界面则容许
                return;
            }
            if (!Auth.isLoginedIn()) {
                event.preventDefault(); //取消默认跳转行为
                $state.go("login");
            }
        });

    //获取图例数据
        mapService.getLegendLayer()
            .success(function (data, status, headers, config) {
            if (data == null) {
                $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
            } else {
                var resultObj = angular.fromJson(data.resultJson);
                console.log(angular.toJson(angular.fromJson(resultObj)[0].typeImage));
                var legendArr = angular.fromJson(resultObj);
                /*var defaultImage = legendArr[0].defaultImage;
                var typeImageArr = legendArr[0].typeImage;
                var hashmap = hashMap.getInstance();
                for (var i=0; i<typeImageArr.length; i++) {
                    var image = typeImageArr[i].image;
                    var key = typeImageArr[i].key;
                    var value = typeImageArr[i].value;
                    hashmap.put(value, image);
                }
                hashmap.put("defaultImage", defaultImage);*/
                CrimeDataCache.getInstance().lengendData = legendArr;
            }
        })
            .error(function (data, status, headers, config) {
                $.crimeAlert.confirm({content: '图例查询失败!', title: "提示"});
            });


    /*
     * 从数据库获取警情类别数据
     * */
    $rootScope.getJqlb = function () {
        $rootScope.jqlb = [];
        return baseDataService.getJqlb().then(function (data) {
            if (data.status == 200) {
                if (data.data.success) {
                    var xmlDoc = $.parseXML(data.data.resultJson);
                    var dataJson = xmlToJson(xmlDoc).node;
                    var result = [];
                    parseJqlb(dataJson, result);
                    var jqhash = jqlbHashMap.getInstance();
                    for (var i=0; i<result.length; i++) {
                        var obj = result[i];
                        jqhash.put(obj.id, obj.level + "@" + obj.name);
                    }
                    //console.log("jqlbHashMap:" + jqhash.MaptoString());
                    CrimeDataCache.getInstance().data.jqlb = jqhash;
                }
            }
        });
    }();

    function parseJqlb(node, result) {
        var nodeList = [];
        if (Array.isArray(node)) {
            nodeList = node;
        } else {
            nodeList[0] = node;
        }
        for (var i = 0; i < nodeList.length; i++) {
            var id = nodeList[i]['@attributes']['id'];
            var name = nodeList[i]['@attributes']['name'];
            var level = nodeList[i]['@attributes']['level'];
            var jqlb = new Object();
            jqlb.id = id;
            jqlb.name = name;
            jqlb.level = level;
            result.push(jqlb);
            if (nodeList[i].node) {
                parseJqlb(nodeList[i].node, result);
            }
        }
    }
}])

    .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/login');
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'login/tpls/login.html'
            })
            .state('home', {
                url: '/home',
                views: {
                    '': {
                        templateUrl: 'home/tpls/home.html'
                    },
                    'mainhomeContent@home': {
                        templateUrl: 'home/tpls/mainhomeContent.html'
                    },
                    'header@home': {
                        templateUrl: 'home/tpls/header.html'
                    }
                }
            }
        ).state('personSet', {
                url: '/personSet',
                views: {
                    '': {
                        templateUrl: 'home/tpls/home.html'
                    },
                    'header@personSet': {
                        templateUrl: 'home/tpls/header.html'
                    },
                    'personSetContent@personSet': {
                        templateUrl: 'personSet/tlps/personSet.html'
                    },
                    'logView@personSet': {
                        templateUrl: 'personSet/tlps/logList.html'
                    }
                }
            }
        ).state("personSet.log", {
                url: "/log",
                views: {
                    '': {
                        templateUrl: 'personSet/tlps/personSet.html'
                    },
                    'logView@personSet': {
                        templateUrl: 'personSet/tlps/logList.html'
                    }
                }
            })
            .state('personSet.jqlbSet', {
                url: '/jqlbSet',
                views: {
                    '': {
                        templateUrl: 'personSet/tlps/personSet.html'
                    },
                    'logView@personSet': {
                        templateUrl: 'personSet/tlps/jqlbSet.html'
                    }
                }
            });
        $httpProvider.interceptors.push("timestampMarker");
    }]);


ezcrime.factory('timestampMarker', ["$rootScope", function ($rootScope) {
    var timestampMarker = {
        request: function (config) {
            $rootScope.loading = true;
            config.requestTimestamp = new Date().getTime();
            console.log("beginRequest",config.requestTimestamp);
            return config;
        },
        response: function (response) {
            $rootScope.loading = false;
            response.config.responseTimestamp = new Date().getTime();
            console.log("endRequest"+response.config.responseTimestamp);
            return response;
        },
        requestError: function (rejectReason) {
            $rootScope.loading = false;
        },
        responseError: function (response) {
            $rootScope.loading = false;
        }
    };
    return timestampMarker;
}]);

/**
 * 功能模块选择
 */
ezcrime.controller("navModuleController",["$scope","DrawGraphService", function($scope, DrawGraphService) {
    /* 弹出警情查询窗口 */
    $scope.switchJq = function () {
        $('.startTime_datetime').datetimepicker({
            autoclose: true,
            startView: 3,
            minView: 2,
            maxView: 2,
            todayBtn: true,
            keyboardNavigation: true,
            language: "zh-CN",
            showMeridian: true,
            showMeridian: 1
        });
        $('.endTime_datetime').datetimepicker({
            autoclose: true,
            startView: 3,
            minView: 2,
            maxView: 2,
            todayBtn: true,
            keyboardNavigation: true,
            language: "zh-CN",
            showMeridian: true,
            showMeridian: 1
        });
        var fmap = document.getElementById("fmap").map;
        DrawGraphService.clearAllLayer(fmap); //清除地图图层
        $('#jqModal').modal();
        $("#legend").hide();
    };
    $scope.switchPersonQuery = function () {
        $('.startTime_datetime').datetimepicker({
            autoclose:true,
            startView: 3,
            minView:2,
            maxView:2,
            todayBtn:true,
            keyboardNavigation:true,
            language:"zh-CN",
            showMeridian:true,
            showMeridian:1
        });
        $('.endTime_datetime').datetimepicker({
            autoclose:true,
            startView: 3,
            minView:2,
            maxView:2,
            todayBtn:true,
            keyboardNavigation:true,
            language:"zh-CN",
            showMeridian:true,
            showMeridian:1
        });
        var fmap = document.getElementById("fmap").map;
        DrawGraphService.clearAllLayer(fmap); //清除地图图层
        $('#personQueryModal').modal();
        $("#legend").hide();
    }

    $scope.switchAj = function () {
        $('.startTime_datetime').datetimepicker({
            autoclose: true,
            startView: 3,
            minView: 2,
            maxView: 2,
            todayBtn: true,
            keyboardNavigation: true,
            language: "zh-CN",
            showMeridian: true,
            showMeridian: 1
        });
        $('.endTime_datetime').datetimepicker({
            autoclose: true,
            startView: 3,
            minView: 2,
            maxView: 2,
            todayBtn: true,
            keyboardNavigation: true,
            language: "zh-CN",
            showMeridian: true,
            showMeridian: 1
        });
        var fmap = document.getElementById("fmap").map;
        DrawGraphService.clearAllLayer(fmap); //清除地图图层
        $('#ajModal').modal();
        $("#legend").hide();
    }
}]);

/**
 * @des 退出系统
 */
ezcrime.controller("HeaderController", ["$scope", "$state", "Auth", function ($scope, $state, Auth) {
    $scope.loginOut = function () {
        Auth.logout();
        $state.go("login");
    }

    $scope.personSet = function () {
        $state.go("personSet");
        $("#personSet_log").addClass("active");
        $("#personSet_jq").removeClass("active");
    }
}]);







