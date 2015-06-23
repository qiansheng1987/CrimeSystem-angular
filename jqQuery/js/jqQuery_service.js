/**
 * Created by Administrator on 2015/4/13.
 */
var jqQueryModule = angular.module('ez.jqQueryModule');
jqQueryModule.factory('JqQueryService', ['serviceFactory', function (serviceFactory) {

    var myexport = {};

    //按警情编号查询
    myexport.queryByJqbh = function (jqbh) {
        var jqbh = jqbh;
        var fields = "  t.jqbh jqbh , t.jqms jqms , to_char(t.alarmtime, 'YYYY-MM-DD') alarmtime , "
            + " t.wldm  wldm , t.xldm  xldm, t.zldm zldm ,t.dldm dldm , "
            + "t.sspcsdm sspcsdm , t.ssgafjdm ssgafjdm , t.location.SDO_POINT.X x , t.location.SDO_POINT.Y y ,  " +
            " t.bjr bjr , t.jjr jjr , t.bjdh bjdh , t.jqdd jqdd ";
        var where = "where ";
        where += " t.jqbh = '" + jqbh + "'";
        var sql = " select " + fields + "from ezcrm_jq_pt t " + where;
        console.log(sql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': sql, 'fieldid': '"queryJqById"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    //扩展查询
    myexport.extendQuery = function (jqQueryParams) {
        var fields = "  t.jqbh jqbh , t.jqms jqms , to_char(t.alarmtime, 'YYYY-MM-DD') afsj , "
            + " t.wldm  wldm , t.xldm  xldm, t.zldm zldm ,t.dldm dldm , "
            + " t.ssgajdm sj, t.sspcsdm pcs , t.ssgafjdm fj , t.location.SDO_POINT.X x , t.location.SDO_POINT.Y y ";
        var where = " where";
        if (jqQueryParams.startTime && jqQueryParams.endTime) { //时间不为空
            where += " t.alarmtime  >=  to_date('" + jqQueryParams.startTime + "','yyyy-mm-dd') " +
            " and t.alarmtime <= to_date('" + jqQueryParams.endTime + "','yyyy-mm-dd')";
        }

        if (jqQueryParams.jqReporter) {
            where += " and t.JJR = '" + jqQueryParams.jqReporter + "'";
        }

        if (jqQueryParams.jqlbwhere) {
            where += " and " + jqQueryParams.jqlbwhere;
        }

        if (jqQueryParams.zzjgwhere && jqQueryParams.zzjgwhere.length != 0) {
            where += ' and ' + jqQueryParams.zzjgwhere;
        }

        var querySql = " select " + fields + " from ezcrm_jq_pt t " + where;
        console.log("扩展查询：" + querySql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': querySql, 'fieldid': '"extendJq"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    //空间查询
    myexport.spacialQuery = function (cords) {
        var fields = " t.location.SDO_POINT.X X, " +
            " t.location.SDO_POINT.Y Y," +
            " t.jqbh jqbh," +
            " t.jqms jqms," +
            " t.alarmtime alarmtime," +
            " t.wldm wldm," +
            " t.xldm xldm," +
            " t.zldm zldm," +
            " t.dldm dldm," +
            " t.sspcsdm sspcsdm," +
            " t.ssgafjdm ssgafjdm";
        var where = " where 1 = 1 ";
        var spatialQueryStr = " and SDO_RELATE(t.Location,SDO_GEOMETRY(2003,8307,NULL,SDO_ELEM_INFO_ARRAY(1,1003,1)," +
            " SDO_ORDINATE_ARRAY(" + cords + ")),'MASK=INSIDE')='TRUE'";
        var querySql = " select " + fields + " from ezcrm_jq_pt t " + where + spatialQueryStr;
        console.log("空间查询sql: " + querySql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': querySql, 'fieldid': '"JqSpacialQuery"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    return myexport;
}]);

/**
 * 警情上图服务
 */
jqQueryModule.factory("MapService", ["$rootScope", function ($rootScope) {
    var hashmap = hashMap.getInstance();
    var singleMarker = (function () {
        var unique;

        function getInstance() {
            if (unique === undefined) {
                unique = new EzServerClient.MarkerClusterGroup();
            }
            return unique;
        }

        return {
            getInstance: getInstance
        }
    })();

    return {
        showDataOnMap: function (data) {
            var resultObj = angular.fromJson(data.resultJson);
            var map = document.getElementById("fmap").map;
            var markers = singleMarker.getInstance();
            var length = resultObj.jsonlist.length;
            if (length == 0) {
                $.crimeAlert.confirm({content: '没有查询到警情!', title: "提示"});
            }
            markers.clearLayers();
            //var defaultImage = hashmap.get("defaultImage");
            var lengendData = CrimeDataCache.getInstance().lengendData;
            var defaultImage = lengendData[0]['defaultImage'];
            var defaultIcon = EzServerClient.icon({
                iconUrl: defaultImage
            });
            //显示图例
            showLegend();
            for (var i = 0; i < length; i++) {
                var jqObj = resultObj.jsonlist[i];
                var marker = "";
                if (jqObj.WLDM != null) {
                    var WLDMIcon = createIconUrl(jqObj.WLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: WLDMIcon}).bindPopup(jqObj.JQMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.XLDM != null) {
                    var XLDMIcon = createIconUrl(jqObj.XLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: XLDMIcon}).bindPopup(jqObj.JQMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.ZLDM != null) {
                    var ZLDMIcon = createIconUrl(jqObj.ZLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: ZLDMIcon}).bindPopup(jqObj.JQMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.DLDM != null) {
                    var DLDMIcon = createIconUrl(jqObj.DLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: DLDMIcon}).bindPopup(jqObj.JQMS);
                    markers.addLayer(marker);
                    continue;
                } else {
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: defaultIcon}).bindPopup(jqObj.JQMS);
                    markers.addLayer(marker);
                }
            }
            var centerPoint = "";
            if (resultObj.jsonlist.length != 0) {
                centerPoint = resultObj.jsonlist[0];
                map.setView(getLatLng(centerPoint), mapConfig.zoom + 2);
            }
            markers.addTo(map);
        }
    }

    //显示图例
    function showLegend() {
        //var hashmap = hashMap.getInstance();
        $("#legend").show("slow");
    }

    function getLatLng(jqObj) {
        return new EzServerClient.LatLng(jqObj.Y, jqObj.X);
    }

    function createIconUrl(jqlb) {
        var iconUrl = null;
        var lengendData = CrimeDataCache.getInstance().lengendData;
        var defaultImage = lengendData[0]['defaultImage'];
        //var defaultImage = hashmap.get("defaultImage");
        if (hashmap.get(jqlb) === undefined) {
            iconUrl = defaultImage;
        } else {
            iconUrl = hashmap.get(jqlb);
        }
        var WLDMIcon = EzServerClient.icon({
            iconUrl: iconUrl
        });
        return WLDMIcon;
    }
}]);

