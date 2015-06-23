/**
 * Created by qs on 2015/6/18.
 */
var ajQueryModule = angular.module('ez.ajQueryModule', ['baseServiceModule', 'ez.genealogy']);

/**
 * 案件查询模块指令
 */
ajQueryModule.directive("ajPop", function () {
    return {
        restrict: "ECMA",
        templateUrl: "ajQuery/tlps/ajhtml.html",
        replace: true,
        link: function (scope, element, attrs, superCtrl) {
            var $this = $(element);
            $this.find('#ajzzjg').click(function () {
                console.log('需要组织机构');
                $this.find('#ajModal').modal('hide');
                $this.find('.modal-above-zzjg').css('display', 'block');
            });
        }
    }
});

ajQueryModule.controller('AjQueryController', ['$scope', '$filter', 'AjQueryService', 'AjMapService', 'DrawGraphService',
    function ($scope, $filter, AjQueryService, AjMapService, DrawGraphService) {

        $scope.ajbhQueryParams = {ajbh: 'J3204045808100000725'};
        $scope.ajQueryParams = {};
        $scope.spacialParams = {};
        //案件编号查询
        $scope.ajbhQuery = function () {
            $('#ajModal').modal('hide');
            AjQueryService.queryByAjbh($scope.ajbhQueryParams.ajbh)
                .success(function (data, status, headers, config) {
                    if (data == null) {
                        $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                    } else {
                        AjMapService.showDataOnMap(data);
                    }
                })
                .error(function (data, status, headers, config) {
                    $.crimeAlert.confirm({content: '案件查询失败', title: "提示"});
                });
        }
        
        $scope.change = function (type) {
            if (type == "startTime" | type == "endTime") {
                $("#ajExtendTip").html("");
            }
        }

        $scope.ajExtendQuery = function (valid) {
            if (valid) {
                var startTime = $scope.ajQueryParams.ajstartTime;
                var endTime = $scope.ajQueryParams.ajendTime;
                var diffTime = (Date.parse(endTime) - Date.parse(startTime)) / 3600 / 1000;

                if (diffTime < 0) {
                    $("#ajExtendTip").html("开始时间大于结束时间!");
                    $("#ajstartTime").addClass("color", "red");
                    return;
                }
                $('#ajModal').modal('hide');
            } else {
                return ;
            }



            AjQueryService.ajExtQuery($scope.ajQueryParams)
                .success(function (data, status, headers, config) {
                    if (data == null) {
                        $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                    } else {
                        AjMapService.showDataOnMap(data);
                    }
                })
                .error(function (data, status, headers, config) {
                    $.crimeAlert.confirm({content: '案件扩展查询失败', title: "提示"});
                });
        }

        $scope.submitJqbhQuery = function (type) {
            $('#ajModal').modal('hide');
            var fmap = document.getElementById("fmap").map;
            var buffer = $scope.ajQueryParams.buffer;
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

        /**
         * @des 多边形查询
         * @param config
         */
        function polygonQuery(config) {
            DrawGraphService.polygonAroundQuery(config, function (data) {
                $('#ajModal').modal('hide');
                AjQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            AjMapService.showDataOnMap(data);

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
                $('#ajModal').modal('hide');
                AjQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            AjMapService.showDataOnMap(data);
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
                $('#ajModal').modal('hide');
                AjQueryService.spacialQuery(data)
                    .success(function (data, status, headers, config) {
                        if (data == null) {
                            $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                        } else {
                            AjMapService.showDataOnMap(data);
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
                    $('#ajModal').modal('hide');
                    AjQueryService.spacialQuery(data)
                        .success(function (data, status, headers, config) {
                            if (data == null) {
                                $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                            } else {
                                AjMapService.showDataOnMap(data);
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
                $('#ajModal').modal('hide');
                DrawGraphService.reDrawPointAround(config, LatLng, function (data) {
                    AjQueryService.spacialQuery(data)
                        .success(function (data, status, headers, config) {
                            if (data == null) {
                                $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                            } else {
                                AjMapService.showDataOnMap(data);

                            }
                        }).error(function (data, status, headers, config) {
                            $.crimeAlert.confirm({content: '点周边查询失败!', title: "提示"});
                        });
                });
            });
        }
        //$scope.jqlbSelected = [];
        $scope.zzjgSelected = [];

        $scope.$watch( function () {
            return $scope.zzjgSelected;
        }, function (newValue) {
            $scope.ajQueryParams.zzjgmc = $filter('namesFilter')(newValue);
            $scope.ajQueryParams.zzjgid = $filter('idFilter')(newValue);
            $scope.ajQueryParams.zzjgwhere = $filter('zzjgWhereFilter')( $filter('zzjgCategoryFilter')(newValue) );
        }, true);

        $scope.updateData = function (pData) {
            if( pData.type == 'jqlb' ){
                $scope.jqlbSelected.splice(0, $scope.jqlbSelected.length );
                $scope.jqlbSelected = $scope.jqlbSelected.concat(pData.list);
            }else if( pData.type == 'zzjg'){
                $scope.zzjgSelected.splice(0, $scope.zzjgSelected.length );
                $scope.zzjgSelected = $scope.zzjgSelected.concat(pData.list);
            }
        }

        $scope.$on('ajGenealogyPopClose', function () {
            $('#ajModal').modal('show');
        });
    }]);




