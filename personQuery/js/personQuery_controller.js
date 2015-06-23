/**
 * Created by YP on 2015-06-09.
 */
var personQueryModule = angular.module('ez.personQueryModular', ['baseServiceModule', 'ez.genealogy']);

personQueryModule.controller('PersonQueryController', ['$scope', 'personQueryService', 'DrawGraphService', function ($scope, personQueryService, DrawGraphService) {
    $scope.personQueryForSFZH = { sfzh: "", sfzhQueryResult: [] };

    //常住:1, 暂住:2,外宾:4
    var RYXZ_CONFIG = { "permanent":"1", "temporary":"2", "foreign":"4", "all":0 };
    var RYXZ_CONFIG_REVERSE = { "1":"常住", "2":"暂住", "4":"外宾", "0": "全部" };
    var SEX_CONFIG = { "male": 1, "female": 2, "all":0 };

    $scope.sfzQueryHandler = function () {
        console.log("身份证查询");
        $scope.updateData( {} );//todo 为什么可以访问到警情查询控制器下$scope上定义的方法
        personQueryService.queryBySFZH( $scope.personQueryForSFZH.sfzh )
            .success(function (data, status, headers, config) {
                if (data == null || !data.success) {
                    $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                } else {
                    $scope.personQueryForSFZH.sfzhQueryResult = angular.fromJson(data.resultJson)['jsonlist'];
                    showDataOnMap( $scope.personQueryForSFZH.sfzhQueryResult );
                    $('#personQueryModal').modal('hide');
                }
            })
            .error(function (data, status, headers, config) {
                $.crimeAlert.confirm({content: '人员查询：根据身份证号查询失败！', title: "提示"});
            });
    };

    function showDataOnMap(pDatas) {
        var map = document.getElementById("fmap").map;
        DrawGraphService.drawClusterMarkers(map, pDatas,null,null,null,null, bindPopupFunc );
    };

    function bindPopupFunc( person ){
        var pop = EzServerClient.popup({
            maxWidth: 400,
            maxHeight: 500
        });
        var htmlContent =  '<div class="pop-detail">\
            <div class="pop-header">\
                详细信息\
            </div>\
            <div class="pop-body">\
            <form class="form-horizontal">\
            <div class="form-group">\
            <label class="control-label detail-item detail-item-label"><strong>姓名：</strong></label><label class="control-label detail-item detail-item-value">' + person['XM'] + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>性别：</strong></label><label class="control-label detail-item detail-item-value">' + person['XB'] + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>出生日期：</strong></label><label class="control-label detail-item detail-item-value">' + person['CSRQ'].substr(0, 10) + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>身份证号：</strong></label><label class="control-label detail-item detail-item-value">' + person['SFZH'] + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>现居住地：</strong></label><label class="control-label detail-item detail-item-value">' + person['XJZD'] + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>人员性质：</strong></label><label class="control-label detail-item detail-item-value">' + RYXZ_CONFIG_REVERSE["" +person['RYXZBH']] + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>国籍：</strong></label><label class="control-label detail-item detail-item-value">' + person['GJ'] || "中国" + '</label>\
            <label class="control-label detail-item detail-item-label"><strong>工作：</strong></label><label class="control-label detail-item detail-item-value">' + person['ZY'] + '</label>\
            </div>\
            </form>\
            </div>\
            <div class="pop-footer">\
            <button class="btn btn-default">周边查询</button>\
            </div>\
            </div>';

        pop.setContent(htmlContent);
        return pop;
    }


    $scope.personQueryForExt = {
        'name':'高超',
        'sex':'all',
        'sexdm':'',
        'ageLower': 10,
        'ageUpper': 20,
        'job':'司机',
        'ryxz':'',
        'ryxzbh':'',
        'starttime':'',
        'starttime':'',
        'zzjgwhere':'',
        extQueryResult: []

    };
    $scope.extQueryHandler = function () {

        if( $scope.personQueryForExt.ageLower >= $scope.personQueryForExt.ageUpper ){
            //todo 提示年龄输入错误
            return;
        }
        var currentDate = new Date();
        var startTimeDate = new Date( currentDate.getFullYear()-$scope.personQueryForExt.ageUpper, 0, 1);
        var endTimeDate = new Date( currentDate.getFullYear()-$scope.personQueryForExt.ageLower, 0, 1);
        $scope.personQueryForExt.starttime = Date.prototype.Format.call(startTimeDate, 'yyyy-MM-dd');
        $scope.personQueryForExt.endtime = Date.prototype.Format.call(endTimeDate, 'yyyy-MM-dd');

        $scope.personQueryForExt.ryxzbh = RYXZ_CONFIG[ '' +$scope.personQueryForExt.ryxz ];
        $scope.personQueryForExt.sexdm = SEX_CONFIG[ '' +$scope.personQueryForExt.sex ];


        personQueryService.queryByCondition($scope.personQueryForExt)
            .success(function (data, status, headers, config) {
                if (data == null || !data.success) {
                    $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                } else {
                    $scope.personQueryForExt.extQueryResult = angular.fromJson(data.resultJson)['jsonlist'];
                    showDataOnMap($scope.personQueryForExt.extQueryResult);
                    $('#personQueryModal').modal('hide');
                }
            })
            .error(function (data, status, headers, config) {
                $.crimeAlert.confirm({content: '人员查询：根据身份证号查询失败！', title: "提示"});
            });
    }

}]);

personQueryModule.directive('personQueryPop', function () {
    return{
        restrict: 'E',
        replace: true,
        templateUrl: 'personQuery/tpls/personQuery.html',
        link: function( scope, ele, attr, superCtrl ){

        }
    }
});

//todo test
personQueryModule.directive('personTest', function () {
    return{
        restrict: 'E',
        replace: true,
        templateUrl: ''

    }
});
//todo test
personQueryModule.controller('PersonTestController', ['$scope', function ($scope) {
    $scope.test3 = { name: 'zhang'};
    $scope.getTest3Name = function () {
        return $scope.test3.name;
    }
}]);
