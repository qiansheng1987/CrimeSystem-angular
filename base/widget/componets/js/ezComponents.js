/**
 * ez中自定义的常用组件指令
 *
 * 指令列表：
 *        h-tab: 水平显示的tab页
 *        v-tab： 垂直显示的tab页
 *
 * Created by YP on 2015-05-04.
 */
var ezComponents = angular.module ('ez.components', []);

/*
* 处理tab页的控制器
* */
ezComponents .controller ('paneManager', ['$scope','$rootScope', function ($scope,$rootScope) {
    var panes = $scope.panes = [];

    $scope.select = function (pane) {
        angular.forEach(panes, function (pane) {
            pane.selected = false;
        });
        pane.selected = true;
        $rootScope.selectedItem = pane.title; //标记选择哪个pane
    }

    this.addPane = function (pane) {
        if (panes.length == 0) $scope.select(pane);
        panes.push (pane);
    }
}]);

/*
* 水平显示的tab页
* */
ezComponents .directive ('hTabs', function () {
    return {
        controller: 'paneManager',
        restrict: 'E',
        transclude: true,
        template: '<div class="tabbable">' +
            '<ul class="nav nav-tabs">' +
            '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}">' +
            '<a href="" ng-click="select(pane)">{{pane.title}}</a>' +
            '</li>' +
            '</ul>' +
            '<div class="tab-content" ng-transclude></div>' +
            '</div>',
        replace: true
    };
});

/*
* tab页中的实体
* */
ezComponents .directive ('pane', function () {
    return {
        /*controller: 'paneManager',*/
        require: ['?^hTabs', '?^vTabs' ],
        restrict: 'E',
        transclude: true,
        scope: {
            title: '@'
        },
        link : function (scope, element, attrs, tabsCtrl) {
            //require指定了一个数组，所以tabsCtrl就是一个数组，数组的元素分别为require指定指令的控制器
            // 在实际使用中，pane要么是hTabs的子元素，要么是vTabs的子元素，
            // 所以tabsCtrl中有一个元素为null,只需要其中一个即可
            if(Array.isArray(tabsCtrl)){
                for(var i = 0; i < tabsCtrl.length; i++ ){
                    if( tabsCtrl[i] ){
                        tabsCtrl[i].addPane(scope);
                        break;
                    }
                }
            }else{
                tabsCtrl.addPane(scope);
            }
        },
        template: '<div class="tab-pane" ng-class="{active: selected}" ng-transclude>' +
            '</div>',
        replace: true
    };
});

/*
 * 垂直显示的tab页
 * */
ezComponents .directive ('vTabs', function () {
    return {
        controller: 'paneManager',
        restrict: 'E',
        transclude: true,
        scope: {},
        template: '<div class="container-fluid row height-spread" style="padding-left:1px;">' +
            '<div class="col-md-3" style="height: 280px;background-color: #F3F4F5;width: 125px;">' +
            '<ul class="nav nav-tabs nav-stacked" style="border: 1px solid transparent;">' +
            '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}">' +
            '<a href="" style="width: 125px;margin-left:-15px;border: 1px solid transparent;-webkit-border-top-right-radius: 0px;-webkit-border-top-left-radius: 0px;" ng-click="select(pane)">{{pane.title}}</a>' +
            '</li>' +
            '</ul>' +
            '</div>' +
            '<div class="col-md-9 tab-content" style="height:250px;margin-top:30px;" ng-transclude>' +
            '</div>' +
            '</div>',
        replace: true
    };
});
