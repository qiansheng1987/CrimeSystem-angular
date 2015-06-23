/**
 * Created by qiansheng on 2015/6/3.
 */

var personModule = angular.module("ez.personModule");

personModule.factory("personSetService", ['$rootScope', 'serviceFactory',
    function ($rootScope, serviceFactory) {

        var resultF = {};
        /**
         * @des 查询用户操作日志
         * @param logQueryParam
         * @returns {*}
         */
        resultF.getOperateLogByCondition = function (logQueryParam) {
            var fields = "t.userid, t.sszzjg, t.usedate, t.userip, t.operatetype, t.operatecontent, rownum countRows";
            var tableName = "EZCRM_SYSTEM_LOG t";
            var where = " where 1=1 ";
            if (logQueryParam.username) {
                where += " and t.userid = '" + logQueryParam.username + "'";
            }

            if (logQueryParam.operateTypeTemp || logQueryParam.operateTypeTemp != null) {
                where += " and t.operatetype = '" + logQueryParam.operateTypeTemp + "'";
            }

            if (logQueryParam.startTime) {
                where += " and t.usedate >= to_date('" + logQueryParam.startTime + "','yyyy-mm-dd hh24:mi:ss')";
            }

            if (logQueryParam.endTime) {
                where += " and t.usedate <= to_date('" + logQueryParam.endTime + "','yyyy-mm-dd hh24:mi:ss')";
            }

            where += " order by countRows, t.usedate";
            var sql = "select " + fields + " from " + tableName + where;
            console.log("日志查询", sql);
            var opid = "poservice.operate.edit.getlistusedsql";
            var urlparams = {'sqlstr': sql, 'fieldid': '"queryLog"'};
            var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

            return serviceFactory.getDataListByRest(_angular_clientUrl
            + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
            + angular.toJson(jsonstr));
        };

        resultF.getAllOperateLog = function (logQueryParam) {
            var sql = "select * from " +
                "  (select t.userid ," +
                "    t.sszzjg," +
                "    t.usedate," +
                "    t.userip," +
                "    t.operatetype," +
                "    t.operatecontent," +
                "    rownum countRows" +
                "  from EZCRM_SYSTEM_LOG t" +
                "  where 1 = 1) tt where tt.countRows>=1 and tt.countRows<=1000" +
                "  order by tt.countRows, tt.usedate ";
            console.log("日志查询", sql);
            var opid = "poservice.operate.edit.getlistusedsql";
            var urlparams = {'sqlstr': sql, 'fieldid': '"queryLog"'};
            var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

            return serviceFactory.getDataListByRest(_angular_clientUrl
            + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
            + angular.toJson(jsonstr));
        };

        resultF.queryUserLoginInfoRecent = function () {
            var sql = " select t.userid," +
                "  t.sszzjg," +
                " t.usedate," +
                " t.userip," +
                " t.operatetype," +
                " t.operatecontent," +
                "   rownum countRows" +
                " from EZCRM_SYSTEM_LOG t" +
                "   where 1 = 1" +
                "   and t.userid = '" + sessionStorage.getItem("currentUser") + "'" +
                "   and t.operatetype = 0" +
                "   and t.usedate = (select max(t.usedate) from EZCRM_SYSTEM_LOG t)" +
                " order by t.usedate desc";
            console.log("日志查询", sql);
            var opid = "poservice.operate.edit.getlistusedsql";
            var urlparams = {'sqlstr': sql, 'fieldid': '"queryUserLoginInfo"'};
            var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

            return serviceFactory.getDataListByRest(_angular_clientUrl
            + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
            + angular.toJson(jsonstr));
        }

        /**
         * @des 获取关注警情
         */
        resultF.getFocusJq = function () {
            var sql = " SELECT * FROM EZCRM_OWNER_REF t " +
                      " WHERE KEY='focusType' AND USERID= '" + sessionStorage.getItem("currentUser") + "'";
            console.log("获取关注警情", sql);
            var opid = "poservice.operate.edit.getlistusedsql";
            var urlparams = {'sqlstr': sql, 'fieldid': '"queryFocusJqInfo"'};
            var jsonstr = {"opid": opid, "userid": ezConfig.datauser, "jdbcSource": "", "params": urlparams};

            return serviceFactory.getDataListByRest(_angular_clientUrl
            + "/CrossDomainProxy?requestURL=" + ezConfig.poserviceURL + "?jsonstr="
            + angular.toJson(jsonstr));
        }

        /**
         * @des 更新关注警情
         * @returns {*}
         */
        resultF.updateFocusJq = function (jqlb) {
            var jsonstr = {opid:"updateFocusType",params:{"params":"key:focusType;value:"+jqlb+";userid:"+sessionStorage.getItem("currentUser")}};
            return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
            ezConfig.crimeServiceURL + "/JQCaseQueryServlet?jsonstr=" + angular.toJson(jsonstr));
        }

        /**
         * @des 添加关注警情
         * @returns {*}
         */
        resultF.addFocusJq = function (jqlb) {
            var jsonstr = {opid:"addFocusType",params:{"params":"key:focusType;value:"+jqlb+";userid:"+sessionStorage.getItem("currentUser")}};
            return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
            ezConfig.crimeServiceURL + "/JQCaseQueryServlet?jsonstr=" + angular.toJson(jsonstr));
        }

        /**
         * @des 删除关注警情
         * @returns {*}
         */
        resultF.deleteFocusJq = function (jqlb) {
            var jsonstr = {opid:"deleteFocusType",params:{"params":"key:focusType;value:"+jqlb+";userid:"+sessionStorage.getItem("currentUser")}};
            return serviceFactory.getDataListByRest(_angular_clientUrl + "/CrossDomainProxy?requestURL=" +
            ezConfig.crimeServiceURL + "/JQCaseQueryServlet?jsonstr=" + angular.toJson(jsonstr));
        }

        return resultF;
    }]);
