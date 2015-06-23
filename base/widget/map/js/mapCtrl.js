/**
 * Created by Administrator on 2015/4/21.
 */
var mapModule = angular.module("mapApp", []);
mapModule.directive("map", ["$location", function ($location) {
    //var rootPath = getRootPath($location.absUrl());
    return {
        restrict: "E",
        replace: true,
        template: "<div class='showMaps'   id='showMap'></div>",
        link: function (scope, element, attrs) {

            var uEzMap = new EzMap(element.attr("id"));
            uEzMap.initialize2();
            uEzMap.invalidateSize();
            uEzMap.showStandMapControl();
            var ov = new OverView();
            ov.width = 200;

            ov.height = 200;
            uEzMap.addOverView(ov);
        }
    }
}])
    .directive('fmap', [function () {
        return {
            restrict: 'E',
            controller:"LegendCtrl",
            replace: true,
            transclude: true,    
            templateUrl: 'base/widget/map/tpls/map.html',           
            //template: '<div class="full-screen" id="fmap" map=""></div>',
            scope:{
                model:'='
            },
            link : function (scope, element, attrs) {
                var _fullScreenflag = true;
                var shijie = EzServerClient.tileLayer( mapConfig.shijie,{
                    isEzMap:true
                });

                // add an  tile layer
                var map = new EzServerClient.Map('fmap', {
                    center: mapConfig.center,
                    crs: EzServerClient.CRS.EPSG4326Ez,
                    zoom: mapConfig.zoom,
                    isEzMap: mapConfig.isEzMap,
                    layers: [shijie]
                });

                var singleLayer = (function(){
                    var unique;
                    function getInstance(){
                        if( unique === undefined ){
                            unique = new EzServerClient.FeatureGroup();
                        }
                        return unique;
                    }
                    return {
                        getInstance : getInstance
                    }
                })();

                var slideController = EzServerClient.control.zoomslider({
                    collapsed: true,
                    position: 'topleft',
                    stepHeight: 9,
                    zoomInText: '+',
                    zoomInTitle: 'Zoom in',
                    zoomOutText: '-',
                    zoomOutTitle: 'Zoom out'
                });
                //EzServerClient.control.scale().addTo(map);
                var navButton = EzServerClient.control.navButton({
                    position: 'topleft'
                });
                map.addControl(navButton);
                map.addControl(slideController);

                document.getElementById("fmap").map = map;
                element.find("#mapZoomIn").click(function () {
                    map.zoomIn();
                });
                element.find("#mapZoomOut").click(function () {
                    map.zoomOut();
                });

                /**
                 * 清除地图图层
                 */
                element.find("#mapClear").click(function () {
                    //map.clearLayers();
                    map.eachLayer(function(layer){
                        if (!(layer instanceof EzServerClient.TileLayer)) {
                            this.removeLayer(layer);
                        }
                    },map);
                });

                /**
                 * 标点
                 */
                element.find("#mapMarker").click(function (e) {
                    var drawnItems = singleLayer.getInstance();
                    var that = map;
                    map.getContainer().style.cursor = "crosshair";
                    that.on("mousedown",_drawPoint);

                    function _drawPoint(e){
                        drawnItems.clearLayers();
                        var drawPointLatLng = e.latlng;
                        that.off("mousedown",_drawPoint);
                        var marker = EzServerClient.marker(drawPointLatLng).addTo(map);
                        that.getContainer().style.cursor = '';
                        drawnItems.addLayer(marker);
                        map.addLayer(drawnItems);
                    }
                });

                /**
                 * 测距离
                 */
                element.find("#mapDistance").click(function (eOUt) {
                    var drawnItems = singleLayer.getInstance();
                    map.getContainer().style.cursor = 'crosshair';
                    var _drawing = true;
                    var _poly = new EzServerClient.Polyline([],{
                        weight: 3,
                        opacity: 0.8,
                        color:"#EE0000",
                        dashArray: "10,10"
                    });
                    _poly.addTo(map);
                    var that = this;

                    map.on("mousedown", _measureClick);
                    map.on("contextmenu", _measureContextmenu);
                    map.on("mousemove", _measureMove);

                    function _measureClick(e){
                        drawnItems.clearLayers();
                        if (_drawing) {
                            _poly.addLatLng(e.latlng);
                        }
                    }
                    function _measureMove(e){
                        if (_poly.getLatLngs().length !== 0 ) {
                            new EzServerClient.popup()
                                .setLatLng(e.latlng)
                                .setContent("右击结束测量距离")
                                .openOn(map);
                            if (_poly.getLatLngs().length !== 1) {
                                var index = _poly.getLatLngs().length - 1;
                                _poly.spliceLatLngs(index , 1);
                                _poly.addLatLng(e.latlng);
                            }
                            else{
                                _poly.addLatLng(e.latlng);
                            }
                        }
                    }
                    function _measureContextmenu(event){
                        map.getContainer().style.cursor = '';
                        _drawing = false;
                        map.off("mousedown", _measureClick);
                        map.off("mousemove", _measureMove);
                        var index = _poly.getLatLngs().length - 1;
                        _poly.spliceLatLngs(index , 1);
                        map.off("contextmenu", _measureContextmenu);

                        var latlngs = _poly.getLatLngs(),
                            distancesum = 0;
                        for (var i = 0; i < latlngs.length - 1; i++) {
                            distancesum = distancesum + latlngs[i].distanceTo(latlngs[i + 1]);
                        }

                        var distanceStr = null;
                        if (distancesum  > 1000) {
                            distanceStr = (distancesum  / 1000).toFixed(2) + ' km';
                        } else {
                            distanceStr = Math.ceil(distancesum) + ' m';
                        }

                        drawnItems.addLayer(_poly);
                        map.addLayer(drawnItems);
                        //显示测试距离
                        new EzServerClient.popup()
                            .setLatLng(event.latlng)
                            .setContent("距离为:" + distanceStr)
                            .openOn(map);
                    }
                });

                /**
                 * 测量面积
                 */
                element.find("#mapArea").click(function () {
                    var drawnItems = singleLayer.getInstance();
                    map.getContainer().style.cursor = 'crosshair';
                    var _drawing = true;
                    var _poly = new EzServerClient.Polygon([],{
                        weight: 3,
                        opacity: 0.8,
                        color:"#EE0000"
                    });
                    _poly.addTo(map);
                    var that = this;

                    map.on("mousedown", _drawPolygonClick);
                    map.on("contextmenu", _drawPolygonContextmenu);
                    map.on("mousemove", _drawPolygonMove);

                    function _drawPolygonClick(e){
                        if (_drawing) {
                            _poly.addLatLng(e.latlng);
                            drawnItems.clearLayers();
                        }
                    }

                    function _drawPolygonMove(e){
                        if (_poly.getLatLngs().length !== 0 ) {
                            new EzServerClient.popup()
                                .setLatLng(e.latlng)
                                .setContent("右击结束测量面积")
                                .openOn(map);
                            drawnItems.clearLayers();
                            if (_poly.getLatLngs().length !== 1) {
                                var index = _poly.getLatLngs().length - 1;
                                _poly.spliceLatLngs(index , 1);
                                _poly.addLatLng(e.latlng);
                            }
                            else{
                                _poly.addLatLng(e.latlng);
                            }
                        }
                    }

                    function _drawPolygonContextmenu(e){
                        map.getContainer().style.cursor = '';
                        _drawing = false;
                        map.off("mousedown", _drawPolygonClick);
                        map.off("mousemove", _drawPolygonMove);
                        var index = _poly.getLatLngs().length - 1;
                        _poly.spliceLatLngs(index , 1);
                        map.off("contextmenu", _drawPolygonContextmenu);
                        console.log("_poly.getLatLngs()" + _poly.getLatLngs());

                        drawnItems.addLayer(_poly);
                        map.addLayer(drawnItems);

                        EzServerClient.GeometryUtil.readableArea();
                        var polyArea = showArea(_poly);
                        var readableArea = EzServerClient.GeometryUtil.readableArea(polyArea);
                        new EzServerClient.popup()
                            .setLatLng(e.latlng)
                            .setContent("面积为:" + readableArea)
                            .openOn(map);
                    }

                    function showArea(data) {
                        if(!(data instanceof EzServerClient.Polygon)){return;}
                        var latlngs = data.getLatLngs(),
                            areas = EzServerClient.GeometryUtil.geodesicArea(latlngs);
                        return areas;
                    }
                });

                /**
                 * 全图
                 */
                element.find("#mapFull").click(function () {
                    map.setView( mapConfig.center, mapConfig.zoom );
                });

                /**
                 * 全屏
                 */
                element.find("#mapScreenFull").click(function () {
                    if (_fullScreenflag) {
                        $("#mapContent").css("top","0");

                        $("#headerContent").slideUp("slow");
                        $("#navicateContent").hide("slow");
                        $("#fmap").css("width", $(window).outerWidth() + "px");
                        $("#fmap").css("height", $(window).outerHeight() + "px");
                        $("#mapScreenFullImage").removeClass("glyphicon glyphicon-fullscreen");
                        $("#mapScreenFullImage").addClass("glyphicon glyphicon-resize-small");
                        $("#legendTitle").css("bottom", 0);
                        $("#legendLayer").css("bottom", "25px");
                        $("#mapScreenFullText").text("还原");
                        _fullScreenflag = false;
                    } else {
                        $("#mapContent").css("top","80px");
                        $("#legendTitle").css("bottom", "140px");
                        $("#legendLayer").css("bottom", "160px");
                        $("#headerContent").slideDown("slow");
                        $("#navicateContent").show("slow");
                        $("#fmap").css("width", "100%");
                        $("#fmap").css("height", "100%");
                        $("#mapScreenFullImage").removeClass("glyphicon glyphicon-resize-small");
                        $("#mapScreenFullImage").addClass("glyphicon glyphicon-fullscreen");
                        $("#mapScreenFullText").text("全屏");
                        _fullScreenflag = true;
                    }
                });
            }
        }
    }]);

/**
 * @des 图例控制器
 */
mapModule.controller("LegendCtrl", ["$scope","$element","$attrs","$transclude","mapService",
    function($scope, $element,$attrs,$transclude,mapService){
    $transclude(function (clone) {
        $element.find("#legend").hide();
        var flag = true;
        $element.find("#legendTitle").on("click", function () {
            if (flag) {
                $element.find("#legendLayer").hide("slow");
                $element.find("#legendTitleImage").removeClass("fa fa-compress fa-2x");
                $element.find("#legendTitleImage").addClass("fa fa-expand fa-2x");
                flag = false;
            } else {
                $element.find("#legendLayer").show("slow");
                $element.find("#legendTitleImage").removeClass("fa fa-expand fa-2x");
                $element.find("#legendTitleImage").addClass("fa fa-compress fa-2x");
                flag = true;
            }
        });
        var lengendData = CrimeDataCache.getInstance().lengendData;
        //var jqlbHashMap = CrimeDataCache.getInstance().jqlbHashMap;

        var jqlegendArr = [];
        var defaultImage = lengendData[0].defaultImage;
        var typeImageArr = lengendData[0].typeImage;
        for (var i=0; i<typeImageArr.length; i++) {
            var obj = new Object();
            var image = typeImageArr[i].image;
            var key = typeImageArr[i].key;
            var value = typeImageArr[i].value;
            obj.image = image;
            obj.key = key;
            obj.value = value;
            jqlegendArr.push(obj);
        }
        var legendTable = $element.find("#legendTable");
        var div = "";
        div += "<tr>";
        for (var i=0; i<jqlegendArr.length; i++) {
            var imageObj = jqlegendArr[i];
            if ( i%4 == 0) {
                div += "</tr><tr>";
                div += "<td style='width: 60px;padding-left: 18px;'><img src='"+imageObj.image+"'/><p>'"+imageObj.value+"'</p></td>";
            } else {
                div += "<td style='width: 60px;padding-left: 18px;'><img src='"+imageObj.image+"'/><p>'"+imageObj.value+"'</p></td>";
            }
        }
        div += "</tr>";
        legendTable.append(div);
    });
}]);
