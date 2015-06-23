/**
 * Created by YP on 2015-04-16.
 */
var ezcrime = angular.module("ezcrime");

ezcrime.directive("zzjgtree",["$location", function($location){
    alert("这是指令");
    var rootPath = getRootPath( $location.absUrl() );
    return {
        restrict : "E",
        replace : true,
        templateUrl : rootPath + "/base/widget/zzjgtree/tpls/zzjgTree.html",
        link: function (scope, element, attr, parentController) {
            alert("这是 link 函数");
            var setting = {};
            $.fn.zTree.init($("#zzjgTree", element), setting, scope.zzjgData);

        }
    }
}]);
