/**
 * Created by Administrator on 2015/4/24.
 */
var routersApp = angular.module("routerApp",['mapApp','ui.router']);
routersApp.config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise("/maps" );
    $stateProvider
        .state(
            "test",{
            url:"/maps",
            views:{
                'testMap@':{
                   template:"<map></map>"}
            }
        }
    )
}])