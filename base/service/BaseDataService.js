/**
 * 基础数据查询服务
 * 功能包括：
 *     getJqlb : 获取警情类别
 *
 * Created by YP on 2015-05-20.
 */

var serviceModule = angular.module("baseServiceModule");
serviceModule.factory( 'baseDataService',['serviceFactory', function (serviceFactory) {
    var myexport = {};

    /*
     * 获取案件类别数据
     * */
    myexport.getAjlb = function () {
        /*var req:EZRequest=new EZRequest(CrimeModelCache.getInstance().data.systemConfig.serviceurl.crimeServiceURL+"/"+"CaseSearchServlet");
         var obj:Object=new Object();
         obj.params="lbs"
         req.sendurl("loadCaseType",JSON.stringify(obj),callback);*/

        /*var obj = {params: 'lbs'};
         return serviceFactory.getDataListByRest(_angular_clientUrl
         + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
         + angular.toJson(jsonstr));*/


        var jsonstr = {opid:'loadCaseType',params:{'params': 'lbs'}};
        return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
        ezConfig.crimeServiceURL + "/CaseSearchServlet?jsonstr=" + angular.toJson(jsonstr));
    };

    myexport.getJqlb = function () {
        var jsonstr = {opid:'loadJqType',params:{'params': 'lbs'}};
        return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
        ezConfig.crimeServiceURL + "/JQCaseQueryServlet?jsonstr=" + angular.toJson(jsonstr));
    };

    myexport.getZzjg = function () {
        var jsonstr = {opid:'queryXQTree',params:{'params': 'lbs'}};
        return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
        ezConfig.crimeServiceURL + "/QuerySpatialServlet?jsonstr=" + angular.toJson(jsonstr));
    };

    return myexport;
}] );

/*
* 用于共享数据的服务
* */
serviceModule.factory('shareDataService',  function () {
    return {

    }

});