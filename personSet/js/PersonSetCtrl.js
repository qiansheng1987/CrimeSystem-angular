/**
 * Created by qiansheng on 2015/6/3.
 */

var personModule = angular.module("ez.personModule", ['ui.router', 'baseServiceModule', 'ez.genealogy']);

/*personModule.run(['$rootScope', '$state', '$stateParams','$location','Auth',
    function ($rootScope, $state, $stateParams,$location,Auth) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        //给$routerChangeStart设置监听
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams){
                //alert("!Auth.isLoginedIn()):" + Auth.getUser());
                if (!Auth.isLoginedIn()) {
                    $location.path("/login");
                } else {
                    $location.path(toState.url);
                }
            });

    }]).config(['$stateProvider', '$urlRouterProvider', '$httpProvider',
    function ($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider
            .state("personSet.log",{
                url: "/log",
                views: {
                    '': {
                        templateUrl: 'personSet/tlps/personSet.html'
                    },
                    'logView@personSet':{
                        templateUrl: 'personSet/tlps/logList.html'
                    }
                }
            })
            //nested states
            // url will be /personSet/jqlbSet
            .state('personSet.jqlbSet', {
                url: '/jqlbSet',
                views: {
                    '': {
                        templateUrl: 'personSet/tlps/personSet.html'
                    },
                    'logView@personSet':{
                        templateUrl: 'personSet/tlps/jqlbSet.html'
                    }
                }
            });
}]);*/

personModule.filter('selectedFocusJqNameFilter', function () {
    return function (level) {
        var jqlbType = "";
        if (level == 1) {
            jqlbType = "大类";
        } else if (level == 2) {
            jqlbType = "中类"
        } else if (level == 3) {
            jqlbType = "小类"
        } else if (level == 4) {
            jqlbType = "微类"
        }
        return jqlbType;
    }
});


personModule.filter('startFrom', function () {
    return function (input, start) {
        start = +start;
        return input.slice(start);
    }
});

personModule.filter('transOperateType', function () {
    return function (input) {
        if (input == 0) {
            return "登录";
        } else if (input == 1) {
            return "退出";
        } else if (input == 5) {
            return "查询";
        } else if (input == 2) {
            return "添加";
        } else if (input == 4) {
            return "修改";
        } else if (input == 3) {
            return "删除";
        } else if (input == 6) {
            return "分析";
        } else if (input == 9) {
            return "其他";
        }
    }
});

personModule.controller("PersonSetCtrl", ['$scope', '$state', '$filter', 'personSetService',
    function ($scope, $state, $filter, personSetService) {
        $scope.selectedFouceJq = [];
        $scope.UserDefinedFouceJqFlag = false;
        $scope.logQueryParams = {};
        $scope.operateLogs = [];
        $scope.currentPage = 0;
        $scope.pageSize = 15;

        $scope.init = function () {
            personSetService.getAllOperateLog($scope.LogQueryParams)
                .success(function (data, status, headers, config) {
                    if (data == null) {
                        $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                    } else {
                        var result = angular.fromJson(data.resultJson);
                        var jsonStr = [];
                        if (result.jsonlist.length == 0) {
                            $scope.operateLogs = [];
                        } else {
                            for (var i = 0; i < result.jsonlist.length; i++) {
                                $scope.operateLogs.push(result.jsonlist[i]);
                            }
                        }
                    }
                })
                .error(function (data, status, headers, config) {
                    $.crimeAlert.confirm({content: '日志查询失败', title: "提示"});
                });

            personSetService.getFocusJq()
                .success(function (data, status, headers, config) {
                    if (data == null) {
                        $.crimeAlert.confirm({content: '关注警情查询异常!', title: "提示"});
                    } else {
                        var result = angular.fromJson(data.resultJson);
                        var jsonStr = [];
                        if (result.jsonlist.length == 0) {
                            $scope.selectedFouceJq = [];
                        } else {
                            for (var i = 0; i < result.jsonlist.length; i++) {
                                var useredFouceJq = transJqValueToName(result.jsonlist[i]);
                                $scope.selectedFouceJq = useredFouceJq ;
                                if (useredFouceJq.length > 0) { //该用户存在关注警情
                                    $scope.UserDefinedFouceJqFlag = true;
                                }
                                //todo更改关注警情选项
                            }
                        }
                    }
                })
                .error(function (data, status, headers, config) {
                    $.crimeAlert.confirm({content: '关注警情查询失败', title: "提示"});
                });;

        };

        function transJqValueToName(values) {
            var result = [];
            var jqlb = CrimeDataCache.getInstance().data.jqlb;
            if (values.VALUE != null) {
                var valueArr = values.VALUE.split(",");
                for (var i=0; i<valueArr.length; i++) {
                    var obj = new Object();
                    var jqlbObj = jqlb.get(valueArr[i]);
                    var jqlbArr = jqlbObj.split("@");
                    obj.id = valueArr[i];
                    obj.level = jqlbArr[0];
                    obj.name = jqlbArr[1];
                    result.push(obj);
                }
            }
            return result;
        }

        $scope.init();

        $scope.numberOfPages = function () {
            return Math.ceil($scope.operateLogs.length / $scope.pageSize);
        };

        $scope.logManager = function () {
            $('#logManager').modal();
            $("#personSet_log").addClass("active");
            $("#personSet_jq").removeClass("active");
            $state.go("personSet.log");
        }

        $("#operateTypeID li").click(function () {
            var index = $(this).index();
            $("#operateType").val($("#operateTypeID li:eq(" + index + ")").text());
            $scope.logQueryParams.operateTypeTemp = $("#operateTypeID li:eq(" + index + ")").val();
        });

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

        $scope.queryLog = function () {
            $scope.currentPage = 0;
            $('#logManager').modal('hide');
            personSetService.getOperateLogByCondition($scope.logQueryParams)
                .success(function (data, status, headers, config) {
                    if (data == null) {
                        $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                    } else {
                        $scope.operateLogs = [];
                        var result = angular.fromJson(data.resultJson);
                        var jsonStr = [];
                        if (result.jsonlist.length == 0) {
                            $scope.operateLogs = [];
                            $scope.currentPage = 0;
                        } else {
                            $scope.currentPage = 0;
                            for (var i = 0; i < result.jsonlist.length; i++) {
                                $scope.operateLogs.push(result.jsonlist[i]);
                            }
                        }
                    }
                })
                .error(function (data, status, headers, config) {
                    $.crimeAlert.confirm({content: '日志查询失败', title: "提示"});
                });
        }
        /**
         * @des 返回主页面
         */
        $scope.goMainHome = function () {
            $state.go("home");
        }

        /**
         * @des 弹出警情配置窗口
         */
        $scope.jqSet = function () {
            $scope.$broadcast("initfoucsJq",  $scope.selectedFouceJq); //初始化关注警情弹出框
            $('.modal-above-jqlb2').css('display', 'block');
            $("#personSet_jq").addClass("active");
            $("#personSet_log").removeClass("active");
            $state.go("personSet.jqlbSet");
        }
        
        $scope.remove = function (index) {
            var foucsJq = $scope.selectedFouceJq.splice(index, 1);
            $scope.$broadcast("deletefoucsJq", foucsJq[0]);
            //删除对应的关注警情

            var updatedJqhbArr = [];
            var selectFocusJq = $scope.selectedFouceJq;
            if (selectFocusJq.length > 0) {
                for (var i=0; i<selectFocusJq.length; i++) {
                    var jqlbObj = selectFocusJq[i];
                    updatedJqhbArr.push(jqlbObj['id']);
                }
                personSetService.updateFocusJq(updatedJqhbArr.toString());
            } else {
                personSetService.deleteFocusJq();
            }
        }

        /**
         * @des 显示选择并且更新关注警情
         */
        $scope.$on("showjqlbSetResult", function (event) {
            $scope.selectedFouceJq = []; //先清空
            var selectFocusJq = hashMap.getInstance().get("selectedFocusJq");
            var lbs = [];
            for (var i=0; i<selectFocusJq.length; i++) {
                var jqlbObj = selectFocusJq[i];
                var obj = new Object();
                obj.name = jqlbObj['@attributes']['name'];
                obj.level = jqlbObj['@attributes']['level'];
                obj.id = jqlbObj['@attributes']['id'];
                lbs.push(jqlbObj['@attributes']['id']);
                $scope.selectedFouceJq.push(obj);
            }
            //更新关注警情
            if (!$scope.UserDefinedFouceJqFlag) { //用户不存在关注警情 添加
                personSetService.addFocusJq(lbs.toString());
            } else {
                if ($scope.selectedFouceJq.length > 0) { //更新
                    personSetService.updateFocusJq(lbs.toString());
                } else { //删除
                    personSetService.deleteFocusJq(lbs.toString());
                }
            }
        });
    }]);

personModule.controller("UserInfoCtrl", ["$scope","$state","personSetService", function ($scope,$state,personSetService) {
    $scope.currentUser = {};
    $scope.init = function () {
        $scope.currentUser = sessionStorage.getItem("currentUser");
    };
    $scope.queryUserLoginInfoRecent = function () {
        personSetService.queryUserLoginInfoRecent()
            .success(function (data, status, headers, config) {
                if (data == null) {
                    $.crimeAlert.confirm({content: '用户登录信息查询异常!', title: "提示"});
                } else {
                    var result = angular.fromJson(data.resultJson);
                    if (result.jsonlist.length == 1) {
                        $scope.userLoginTimeRecent = result.jsonlist[0]["USEDATE"];
                        $scope.userLoginIpRecent = result.jsonlist[0]["USERIP"];
                    }
                }
            });


    }
    $scope.init();
    $scope.queryUserLoginInfoRecent();

    $(".personSet_tab ul li").click(function () {
        $(".personSet_tab ul li").each(function (index) {
            var active = $(".personSet_tab ul li").attr("class");
                if (active) {
                $(this).removeClass("active");
            } else {
                $(this).addClass("active");
            }
        });
    });
}]);
































