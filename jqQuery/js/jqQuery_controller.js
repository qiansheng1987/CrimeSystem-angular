/**
 * Created by Administrator on 2015/4/13.
 */
var jqQueryModule = angular.module('ez.jqQueryModule', ['baseServiceModule', 'ez.genealogy']);

/**
 * 警情查询提交Controller
 */
jqQueryModule.controller("submitCtrl", ["$scope", "$rootScope", '$filter', 'JqQueryService', 'MapService', 'DrawGraphService',
    function ($scope, $rootScope, $filter, JqQueryService, MapService, DrawGraphService) {
        $scope.jqQueryParams = {jqbh: "2011092806541301"};
        $scope.jqQueryParams.jqlb = $scope.jqlbSelected;
        $scope.spacialParams = {};
        $scope.submitJqbhQuery = function (type) {
            var selectItem = $rootScope.selectedItem;
            if (selectItem == "接警编号查询") {
                $('#jqModal').modal('hide');
                JqQueryService.queryByJqbh($scope.jqQueryParams.jqbh)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);
                        }
                    })
                    .error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: 'doJqbhQuery link 失败', title: "提示"});
                    });
            } else if (selectItem == "扩展查询") {
                $('#jqModal').modal('hide');
                JqQueryService.extendQuery($scope.jqQueryParams)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);
                        }
                    })
                    .error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: 'doExtendQuery link 失败', title: "提示"});
                    });
            } else if (selectItem == "空间查询") {
                $('#jqModal').modal('hide');
                var fmap = document.getElementById("fmap").map;
                var buffer = $scope.jqQueryParams.buffer;
                var config = {map: fmap, buffer: buffer};
                if (type == "point") {
                    pointAroundQuery(config);
                } else if (type == "line") {
                    lineAroundQuery(config);
                } else if (type == "circle") {
                    circleQuery(config);
                } else if (type == "rectangle") {
                    rectangleQuery(config);
                } else if (type == "polygon") {
                    polygonQuery(config);
                }
            }
        };

        /**
         * @des 多边形查询
         * @param config
         */
        function polygonQuery(config) {
            DrawGraphService.polygonAroundQuery(config, function (data) {
                $('#jqModal').modal('hide');
                JqQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);

                        }
                    }).error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: '空间查询失败!', title: "提示"});
                    });
            });
        }

        /**
         * @des 方形查询
         * @param config
         */
        function rectangleQuery(config) {
            DrawGraphService.rectangleAroundQuery(config, function (data) {
                $('#jqModal').modal('hide');
                JqQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);
                        }
                    }).error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: '空间查询失败!', title: "提示"});
                    });
            });
        }

        /**
         * @des 圆形查询
         * @param config
         */
        function circleQuery(config) {
            DrawGraphService.circleAroundQuery(config, function (data) {
                $('#jqModal').modal('hide');
                JqQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);
                        }
                    }).error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: '空间查询失败!', title: "提示"});
                    });
            });
        }

        /**
         * des 线周边查询
         * @param config
         */
        function lineAroundQuery(config) {
            DrawGraphService.drawLine(config, function (LatLngs) {
            DrawGraphService.clearAllLayer(config.map); //清除地图图层
            DrawGraphService.drawLineAround(config, LatLngs, function (data) {
                $('#jqModal').modal('hide');
                JqQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            MapService.showDataOnMap(data);
                        }
                    }).error(function (data, status, headers, config) {
                        $.crimeAlert.confirm({content: '空间查询失败!', title: "提示"});
                    });
            });
        });
    }

        /**
         * @des 点周边查询
         * @param config
         */
        function pointAroundQuery(config) {
            DrawGraphService.clearAllLayer(config.map); //清除地图图层
            DrawGraphService.drawPoint(config, function (LatLng) {
                $('#jqModal').modal('hide');
                DrawGraphService.reDrawPointAround(config, LatLng, function (data) {
                    JqQueryService.spacialQuery(data)
                        .success(function (data, status, headers, config) {
                            if (data == null) {
                                $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                            } else {
                                MapService.showDataOnMap(data);

                            }
                        }).error(function (data, status, headers, config) {
                            $.crimeAlert.confirm({content: '点周边查询失败!', title: "提示"});
                        });
                });
            });
        }

        $scope.$on('jqlbSelectedUpdate', function(event, pData){
            $scope.jqQueryParams.jqlbmc = $filter('namesFilter')(pData);
            $scope.jqQueryParams.jqlbid = $filter('idFilter')(pData);
            $scope.jqQueryParams.jqlbwhere = $filter('jqlbWhereFilter')( $filter('jqlbCategoryFilter')(pData) );
        });
        $scope.$on('zzjgSelectedUpdate', function(event, pData){
            $scope.jqQueryParams.zzjgmc = $filter('namesFilter')(pData);
            $scope.jqQueryParams.zzjgid = $filter('idFilter')(pData);
            $scope.jqQueryParams.zzjgwhere = $filter('zzjgWhereFilter')( $filter('zzjgCategoryFilter')(pData) );


        });
    }]);

/**
 * 警情查询模块指令
 */
jqQueryModule.directive("jqPop", function () {
    return {
        restrict: "ECMA",
        templateUrl: "jqQuery/tlps/jqhtml.html",
        replace: true,
        link: function (scope, element, attrs, superCtrl) {
            //此处element是Array[1], 并不是一个JQuery对象
            var $this = $(element);

            $this.find('#jqlb').click(function () {
                console.log('需要警情类别');
                $this.find('#jqModal').modal('hide');
                //alert("需要警情类别");
                $this.find('.modal-above-jqlb').css('display', 'block');
            });

            $this.find('#zzjg').click(function () {
                console.log('需要组织机构');
                $this.find('#jqModal').modal('hide');
                //alert("需要组织机构");

                $this.find('.modal-above-zzjg').css('display', 'block');
            });

        }
    }
});

jqQueryModule.controller('JqQueryController', ['$scope', function ($scope) {
    $scope.jqlbSelected = [];
    $scope.zzjgSelected = [];

    $scope.$watch( function () {
        return $scope.jqlbSelected;
    }, function (newValue) {
        $scope.$emit('jqlbSelectedUpdate', newValue);
        $scope.$broadcast('jqlbSelectedUpdate', newValue);
    }, true);

    $scope.$watch( function () {
        return $scope.zzjgSelected;
    }, function (newValue) {
        $scope.$emit('zzjgSelectedUpdate', newValue);
        $scope.$broadcast('zzjgSelectedUpdate', newValue);
    }, true);

    /*
    子控制器派发 jqlbSelectedChange
    本控制器派发 jqlbSelectedUpdate
    以防进入死循环
     */
    /*$scope.$on('jqlbSelectedChange', function(event, pData){
        $scope.jqlbSelected = pData;
        $scope.$broadcast('jqlbSelectedUpdate', $scope.jqlbSelected);
    });*/

    $scope.updateData = function (pData) {
        if( pData.type == 'jqlb' ){
            $scope.jqlbSelected.splice(0, $scope.jqlbSelected.length );
            $scope.jqlbSelected = $scope.jqlbSelected.concat(pData.list);
        }else if( pData.type == 'zzjg'){
            $scope.zzjgSelected.splice(0, $scope.zzjgSelected.length );
            $scope.zzjgSelected = $scope.zzjgSelected.concat(pData.list);
        }


    }

    $scope.$on('genealogyPopClose', function () {
        $('#jqModal').modal('show');
    });

}]);




