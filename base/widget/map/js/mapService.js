/**
 * Created by qiansheng on 2015/5/27.
 */

var mapServiceModule = angular.module("mapApp");

mapServiceModule.factory("mapService", ["serviceFactory", function (serviceFactory) {
    var returnF = {};
    returnF.getLegendLayer = function () {
        var opid = "poservice.public.layer.getAllImageByLayer";
        var returnPromise = serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr=" +
        "{opid:\"poservice.public.layer.getAllImageByLayer\",userid:'"+ezConfig.datauser+"'" +
        ",jdbcSource:\"null\",params:{tablenames:\"'EZCRM_DIC_JQ_TYPE'\",owner:'"+ezConfig.datauser+"'}}");
        return returnPromise;
        /*returnPromise
            .success(function (data, status, headers, config) {
                if (data == null) {
                    $.crimeAlert.confirm({content: '查询异常!', title: "提示"});
                } else {
                    var resultObj = angular.fromJson(data.resultJson);
                    console.log(angular.toJson(angular.fromJson(resultObj)[0].typeImage));
                    var legendArr = angular.fromJson(resultObj);
                    var defaultImage = legendArr[0].defaultImage;
                    var typeImageArr = legendArr[0].typeImage;
                    var hashmap = hashMap.getInstance();
                    for (var i=0; i<typeImageArr.length; i++) {
                        var image = typeImageArr[i].image;
                        var key = typeImageArr[i].key;
                        var value = typeImageArr[i].value;
                        hashmap.put(value, image);
                    }
                    hashmap.put("defaultImage", defaultImage);
                    sessionStorage.setItem("jqLegendMap",hashmap.values());
                }
            })
            .error(function (data, status, headers, config) {
                $.crimeAlert.confirm({content: '图例查询失败!', title: "提示"});
            });
*/
    }
    return returnF;
}]);


























