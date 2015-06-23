/**
 * Created by qs on 2015/6/18.
 */
var ajQueryModule = angular.module('ez.ajQueryModule');
ajQueryModule.factory('AjQueryService', ['serviceFactory', function (serviceFactory) {

    var myexport = {};

    //按案件编号查询
    myexport.queryByAjbh = function (ajbh) {
        var fields = " t.ajbh ajbh,"+
                     "  t.ajms ajms,"+
                     "  to_char(t.fasj, 'YYYY-MM-DD') fasj,"+
                     "  t.ajwldm wldm,"+
                     "  t.ajlbdm xldm,"+
                     "  t.ajzldm zldm,"+
                     "  t.ajztdm dldm,"+
                     "  t.location.SDO_POINT.X x,"+
                     "  t.location.SDO_POINT.Y y";
        var where = " where ";
        where += " t.ajbh = '" + ajbh + "'";
        var sql = " select " + fields + " from ezcrm_aj t " + where;
        console.log("查询案件sql:", sql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': sql, 'fieldid': '"queryAjById"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    //扩展查询
    myexport.ajExtQuery = function (ajQueryParams) {
        var fields = " t.ajbh ajbh,"+
                    "  t.ajms ajms,"+
                    "  to_char(t.fasj, 'YYYY-MM-DD') fasj,"+
                    "  t.ajwldm wldm,"+
                    "  t.ajlbdm xldm,"+
                    "  t.ajzldm zldm,"+
                    "  t.ajztdm dldm,"+
                    "  t.location.SDO_POINT.X x,"+
                    "  t.location.SDO_POINT.Y y";
        var where = " where";
        if (ajQueryParams.ajstartTime && ajQueryParams.ajendTime) { //时间不为空
            where += " t.fasj  >=  to_date('" + ajQueryParams.ajstartTime + "','yyyy-mm-dd') " +
            " and t.fasj <= to_date('" + ajQueryParams.ajendTime + "','yyyy-mm-dd')";
        }
        /*if (ajQueryParams.ajlbwhere) {
            where += " and " + ajQueryParams.jqlbwhere;
        }
        */
        if (ajQueryParams.zzjgwhere && ajQueryParams.zzjgwhere.length != 0) {
            where += ' and ' + ajQueryParams.zzjgwhere;
        }

        var querySql = " select " + fields + " from ezcrm_aj t " + where;
        console.log("案件扩展查询：" + querySql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': querySql, 'fieldid': '"ajextendQuery"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    //空间查询
    myexport.spacialQuery = function (cords) {
        var fields = " t.ajbh ajbh,"+
                    "  t.ajms ajms,"+
                    "  to_char(t.fasj, 'YYYY-MM-DD') fasj,"+
                    "  t.ajwldm wldm,"+
                    "  t.ajlbdm xldm,"+
                    "  t.ajzldm zldm,"+
                    "  t.ajztdm dldm,"+
                    "  t.location.SDO_POINT.X x,"+
                    "  t.location.SDO_POINT.Y y";
        var where = " where 1 = 1 ";
        var spatialQueryStr = " and SDO_RELATE(t.Location,SDO_GEOMETRY(2003,8307,NULL,SDO_ELEM_INFO_ARRAY(1,1003,1)," +
            " SDO_ORDINATE_ARRAY(" + cords + ")),'MASK=INSIDE')='TRUE'";
        var querySql = " select " + fields + " from ezcrm_aj t " + where + spatialQueryStr;
        console.log("案件空间查询sql: " + querySql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': querySql, 'fieldid': '"AjSpacialQuery"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    }

    return myexport;
}]);

/**
 * 案件上图服务
 */
ajQueryModule.factory("AjMapService", ["$rootScope", function ($rootScope) {
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
                $.crimeAlert.confirm({content: '没有查询到案件信息!', title: "提示"});
            }
            markers.clearLayers();
            var lengendData = CrimeDataCache.getInstance().lengendData;
            var defaultImage = lengendData[0]['defaultImage'];
            //var defaultImage = hashmap.get("defaultImage");
            var defaultIcon = EzServerClient.icon({
                iconUrl: defaultImage
            });
            for (var i = 0; i < length; i++) {
                var jqObj = resultObj.jsonlist[i];
                var marker = "";
                if (jqObj.WLDM != null) {
                    var WLDMIcon = createIconUrl(jqObj.WLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: WLDMIcon}).bindPopup(jqObj.AJMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.XLDM != null) {
                    var XLDMIcon = createIconUrl(jqObj.XLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: XLDMIcon}).bindPopup(jqObj.AJMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.ZLDM != null) {
                    var ZLDMIcon = createIconUrl(jqObj.ZLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: ZLDMIcon}).bindPopup(jqObj.AJMS);
                    markers.addLayer(marker);
                    continue;
                }
                if (jqObj.DLDM != null) {
                    var DLDMIcon = createIconUrl(jqObj.DLDM);
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: DLDMIcon}).bindPopup(jqObj.AJMS);
                    markers.addLayer(marker);
                    continue;
                } else {
                    marker = new EzServerClient.Marker(getLatLng(jqObj), {icon: defaultIcon}).bindPopup(jqObj.AJMS);
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

    function getLatLng(jqObj) {
        return new EzServerClient.LatLng(jqObj.Y, jqObj.X);
    }

    function createIconUrl(jqlb) {
        var iconUrl = null;
        //var defaultImage = hashmap.get("defaultImage");
        var lengendData = CrimeDataCache.getInstance().lengendData;
        var defaultImage = lengendData[0]['defaultImage'];
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

