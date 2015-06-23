/**
 * Created by YP on 2015-06-09.
 */
var personQueryModule = angular.module('ez.personQueryModular');


personQueryModule.factory('personQueryService', ['serviceFactory', function (serviceFactory) {
    var myexport = {};

    //按身份证查询
    myexport.queryBySFZH = function (sfzh) {
        var sql = "select t.sfzh as sfzh, t.ryxzbh as ryxzbh, t.xb as xb, t.xm as xm, t.csrq as csrq, t.gj as gj, t.xjzd as xjzd," +
            " t.zy as zy, t.x as x, t.y as y   from EZCRM.ezcrm_person t where t.sfzh = '" + sfzh +"' "

        console.log(sql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': sql, 'fieldid': '"personQueryBySFZH"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));
    };

    /*
    * 人员查询：扩展查询
    * */
    myexport.queryByCondition = function (queryObj) {


        var where = " where 1=1 ";
        var tablename = "ezcrm_person t  ";
        var name = String.prototype.trim.call(queryObj["name"]);
        if( name && name != "" ){
            where += " and t.xm like '%" + name + "%' ";
        }

        var sexdm = queryObj["sexdm"];
        if( sexdm != 0 ){
            where += " and t.xb = '" + sexdm + "' ";
        }

        var starttime = queryObj["starttime"];
        var endtime = queryObj["endtime"];
        where += " and t.csrq >= to_date('"+starttime +"','yyyy-mm-dd hh24:mi:ss')"
        + " and t.csrq <= to_date('"+endtime +"','yyyy-mm-dd hh24:mi:ss') ";

        var ryxzbh = queryObj["ryxzbh"];
        if( ryxzbh != 0 ){
            where += " and t.ryxzbh = '" + ryxzbh +"' ";
        }

        if (queryObj.zzjgwhere && queryObj.zzjgwhere.length != 0) {
            where += ' and ' + queryObj.zzjgwhere;
        }

        var job = String.prototype.trim.call( queryObj['job'] );
        if(job.length !=0 ){
            where += " and t.zy like '%" + job + "%' ";
        }

        var fields="t.sfzh sfzh,t.ryxzbh ryxzbh,t.xb xb,t.xm xm,t.csrq csrq,t.gj gj,t.xjzd xjzd,t.zy zy,t.x x,t.y y  ";
        var sql = "select " + fields + " from " + tablename + where;
        console.log("扩展查询：" + sql);
        var opid = "poservice.operate.edit.getlistusedsql";
        var urlparams = {'sqlstr': sql, 'fieldid': '"personQueryCondition"'};
        var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

        return serviceFactory.getDataListByRest(_angular_clientUrl
        + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
        + angular.toJson(jsonstr));

    };

    return myexport;
}]);