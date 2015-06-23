/**
 * Created by qiansheng on 2015/4/13.
 */

var ControllerModule = angular.module("ControllerModule", []);
ControllerModule.controller("testCtrl", ["$scope", "serviceFactory", function ($scope, serviceFactory) {
	//方式1
	 /*serviceFactory.getDataListByJsonp("poservice.public.organization.getallzzjg", "", "")
		.success(function (data, status, headers, config) {
		  alert("方式1:" + angular.toJson(data));
		  $scope.data = data;
	 });*/

    //方式2 poservice
	/*serviceFactory.getDataListByXhr("poservice.public.organization.getallzzjg", "admin", "", function (data,resultStatus,message) {
        alert("方式2：" + angular.toJson(data));
        $scope.data = data;
    },"post");*/
	
	//方式3 restfull
	serviceFactory.getDataListByRest(_angular_clientUrl+ "/CrossDomainProxy?requestURL=http://172.18.68.81:7001/CrimeService_new/CMSV2REST/SystemLogService/getOperateType")
		.success(function (data, status, headers, config) {
		  alert("rest:" + angular.toJson(data));
		  $scope.data = data;
	}).error(function(data, status, headers, config) {
			alert("失败");
	});
}]);


