/**
 * Created by qiansheng on 2015/5/20.
 */


var drawModule = angular.module("baseServiceModule");

/**
 * 封装地图的相关基础操作
 */

drawModule.factory("DrawGraphService", ["$rootScope",function ($rootScope) {

    var config = {
        map:null,
        buffer:10,
        callback:null
    }

    var returnF = {};

    /**
     * @des 多边形查询
     * @param config
     * @param callback
     */
    returnF.polygonAroundQuery = function(config, callback) {
        var _callback = callback;
        var map = config.map;

        map.getContainer().style.cursor = 'crosshair';
        var _drawing = true;
        var _poly = new EzServerClient.Polygon([],{
            weight: 3,
            opacity: 0.8,
            color:"#00CD00",
            fill:true,
            fillColor:"grey",
            fillOpacity:0.4
        });
        _poly.addTo(map);
        map.on("mousedown", _drawPolygonClick);
        map.on("contextmenu", _drawPolygonContextmenu);
        map.on("mousemove", _drawPolygonMove);

        function _drawPolygonClick(e){
            if (_drawing) {
                _poly.addLatLng(e.latlng);
            }
        }

        function _drawPolygonMove(e){
            if (_poly.getLatLngs().length !== 0 ) {
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
            if (_callback != undefined) {
                _callback((angular.fromJson(_poly.toGeoJSON())).geometry.coordinates);
            }
        }
    }

    /**
     * @des 方形查询
     * @param config
     * @param callback
     */
    returnF.rectangleAroundQuery = function (config,callback) {
        var _callback = callback;
        var map = config.map;

        var _drawing = false,
            _rect = null,
            that = this,
            topLeftPoint = null;
        map.dragging.disable();
        map.getContainer().style.cursor = "crosshair";

        map.on("mousedown", _drawRectClick);
        map.on("mousemove", _drawRectMove);
        map.on("mouseup", _drawRectUp);

        function _drawRectClick(e){
            topLeftPoint = e.latlng;
            var bounds = EzServerClient.latLngBounds([topLeftPoint,topLeftPoint]);
            _rect = new EzServerClient.Rectangle(bounds,{
                weight: 3,
                opacity: 0.8,
                color:"#00CD00",
                fill:true,
                fillColor:"grey",
                stroke:true,
                fillOpacity:0.4
            });
            _rect.addTo(map);
            _drawing = true;
        }

        function _drawRectMove(e){
            if (_drawing) {
                _rect.setBounds(EzServerClient.latLngBounds([topLeftPoint,e.latlng]));
            }
        }

        function _drawRectUp(e){
            _rect.setBounds(EzServerClient.latLngBounds([topLeftPoint,e.latlng]));
            map.getContainer().style.cursor = '';
            map.off("mousedown", _drawRectClick);
            map.off("mousemove", _drawRectMove);
            map.off("mouseup", _drawRectUp);
            map.dragging.enable();
            if (_callback !== undefined) {
                _callback((angular.fromJson(_rect.toGeoJSON())).geometry.coordinates);
            }
        }
    }

    /**
     * @des圆形查询
     * @param config
     * @param callback
     */
    returnF.circleAroundQuery = function (config, callback) {
        var _callback = callback;
        var map = config.map;
        map.dragging.disable();
        map.getContainer().style.cursor = 'crosshair';
        var _drawing = false;
        var _circle = null;

        map.on("mousedown", _drawCircleClick);
        map.on("mousemove", _drawCircleMove);
        map.on("mouseup", _drawCircleUp);

        var centerPoint = null;
        function _drawCircleClick(e){
            centerPoint = e.latlng;
            _circle = new EzServerClient.Circle(centerPoint,0,{
                weight: 3,
                opacity: 0.8,
                color:"#00CD00",
                fill:true,
                fillColor:"grey",
                stroke:true,
                fillOpacity:0.4
            });
            _circle.addTo(map);
            _drawing = true;
        }
        function _drawCircleMove(e){
            if (_drawing) {
                var distance = centerPoint.distanceTo(e.latlng);
                _circle.setRadius(distance);
            }
        }
        function _drawCircleUp(e){
            _drawing = false;
            var distance = centerPoint.distanceTo(e.latlng);
            _circle.setRadius(distance);
            map.getContainer().style.cursor = '';
            map.off("mousedown", _drawCircleClick);
            map.off("mousemove", _drawCircleMove);
            map.off("mouseup", _drawCircleUp);
            map.dragging.enable();
            var _circleSouthWest = _circle.getBounds().getSouthWest();
            var _circleNorthEast = _circle.getBounds().getNorthEast();
            var _circleNorthWest = _circle.getBounds().getNorthWest();
            var _circleSouthEast = _circle.getBounds().getSouthEast();
            var corsStr = _circleSouthWest.lng + "," + _circleSouthWest.lat + "," +
                            _circleNorthEast.lng  + "," + _circleNorthEast.lat + "," +
                            _circleNorthWest.lng + "," + _circleNorthWest.lat + "," +
                            _circleSouthEast.lng + "," + _circleSouthEast.lat;

            if (_callback !== undefined) {
                _callback(corsStr);
            }
        }

    }

    /**
     * @des 点周边查询
     * @param config
     * @param LatLng
     * @param callback
     */
    returnF.reDrawPointAround = function (config, LatLng, callback) {
        var _callback = callback;
        var map = config.map;
        map.dragging.disable();
        var _circleOne = new EzServerClient.circle(LatLng,config.buffer, {
            weight: config.buffer,
            opacity: 0.5,
            color:"grey",
            dashArray: "10,10",
            fill:true,
            fillColor:"#00688B",
            stroke:true,
            weight:200,
            fillOpacity:0.4
        });
        _circleOne.addTo(map);
        var cordsStr = "";
        var cords = (angular.fromJson(_circleOne.toGeoJSON())).geometry.coordinates;
        var _circleOneSouthWest = _circleOne.getBounds().getSouthWest();
        var _circleOneNorthEast = _circleOne.getBounds().getNorthEast();
        var _circleOneNorthWest = _circleOne.getBounds().getNorthWest();
        var _circleOneSouthEast = _circleOne.getBounds().getSouthEast();
        map.dragging.enable();
        cordsStr +=  cords[0] + "," + cords[1] + "," +
                    +_circleOneSouthWest.lng + "," + _circleOneSouthWest.lat + ","
                    + _circleOneNorthEast.lng + "," + _circleOneNorthEast.lat + ","
                    + _circleOneNorthWest.lng + "," + _circleOneNorthWest.lat + ","
                    + _circleOneSouthEast.lng + "," + _circleOneSouthEast.lat;
        if (_callback != null) {
            _callback(cordsStr);

        }

    }

    /**
     * @des画点
     * @param config
     */
    returnF.drawPoint = function (config, callback) {
        var _callback = callback;
        var map = config.map;

        map.getContainer().style.cursor = "crosshair";
        map.on("mousedown",_drawPoint);

        function _drawPoint(e){
            var drawPointLatLng = e.latlng;
            map.off("mousedown",_drawPoint);
            map.getContainer().style.cursor = '';
            if (_callback != undefined) {
                _callback(drawPointLatLng);
            }
        }
    }


    /**
     * @des 用于线周边查询画线
     * @param fmap
     * @param LatLngs
     * @param radius
     * @param callback
     * @returns {boolean}
     */
    returnF.drawLineAround = function (config, LatLngs, callback) {
        var returnCords = [];
        var fmap = config.map;
        var line = new EzServerClient.polyline(LatLngs, {
            weight: 400,
            opacity: 0.5,
            color:"grey",
            dashArray: "50,10"
        });
        var lineCenter = new EzServerClient.polyline(LatLngs, {
            weight: 20,
            opacity: 0.3,
            color:"#00CD00",
            fill:true,
            fillColor:"black",
            stroke:true,
            weight:20,
            fillOpacity:0.4
        });
        line.addTo(fmap);
        lineCenter.addTo(fmap);
        var lineSouthWest = line.getBounds().getSouthWest();
        var lineNorthEast = line.getBounds().getNorthEast();
        var lineNorthWest = line.getBounds().getNorthWest();
        var lineSouthEast = line.getBounds().getSouthEast();
        returnCords.push(lineSouthWest);
        returnCords.push(lineNorthEast);
        returnCords.push(lineNorthWest);
        returnCords.push(lineSouthEast);

        var cords = angular.fromJson(LatLngs);
        var cordsLength = cords.length;
        if (cordsLength < 1) {
            return false;
        }
        var firstCircleCenter = cords[0];
        var secondCircleCenter = cords[cordsLength-1]
        var _circleOne = new EzServerClient.circle(firstCircleCenter,config.buffer, {
            weight: 4,
            opacity: 0.5,
            color:"grey"
        });
        var _circleTwo = new EzServerClient.circle(secondCircleCenter,config.buffer, {
            weight: 4,
            opacity: 0.5,
            color:"grey"
        });
        //_circleOne.addTo(fmap);
        //_circleTwo.addTo(fmap);
        var _circleOneSouthWest = _circleOne.getBounds().getSouthWest();
        var _circleOneNorthEast = _circleOne.getBounds().getNorthEast();
        var _circleOneNorthWest = _circleOne.getBounds().getNorthWest();
        var _circleOneSouthEast = _circleOne.getBounds().getSouthEast();
        var _circleTwoSouthWest = _circleTwo.getBounds().getSouthWest();
        var _circleTwoNorthEast = _circleTwo.getBounds().getNorthEast();
        var _circleTwoNorthWest = _circleTwo.getBounds().getNorthWest();
        var _circleTwoSouthEast = _circleTwo.getBounds().getSouthEast();
        returnCords.push(_circleOneSouthWest);
        returnCords.push(_circleOneNorthEast);
        returnCords.push(_circleOneNorthWest);
        returnCords.push(_circleOneSouthEast);
        returnCords.push(_circleTwoSouthWest);
        returnCords.push(_circleTwoNorthEast);
        returnCords.push(_circleTwoNorthWest);
        returnCords.push(_circleTwoSouthEast);
        var returnCordStr = "";
        for (var i=0; i<returnCords.length; i++) {
            returnCordStr += returnCords[i].lng + "," + returnCords[i].lat + ",";
        }
        var oriLineCords = angular.fromJson(LatLngs);
        for (var j=0; j<oriLineCords.length; j++) {
            returnCordStr += oriLineCords[j].lng + "," + oriLineCords[j].lat + ",";
        }

        if (callback != undefined) {
            callback(returnCordStr.slice(0,returnCordStr.length-1));
        }

    }

    /**
     * @des 画线
     * @param config
     * @param callback
     */
    returnF.drawLine = function (config, callback) {
        var distanceStr = null;
        var map = config.map;
        map.getContainer().style.cursor = 'crosshair';
        var _drawing = true;

        var _poly = new EzServerClient.Polyline([],{
            weight: 4,
            opacity: 0.5,
            color:"red",
            dashArray: "10,10"
        });

        _poly.addTo(map);

        map.on("mousedown", _measureClick);
        map.on("contextmenu", _measureContextmenu);
        map.on("mousemove", _measureMove);

        function _measureClick(e){
            if (_drawing) {
                _poly.addLatLng(e.latlng);
            }
        }

        function _measureMove(e){
            if (_poly.getLatLngs().length !== 0 ) {
                new EzServerClient.popup()
                    .setLatLng(e.latlng)
                    .setContent("右击结束画线")
                    .openOn(map);
                if (_poly.getLatLngs().length !== 1) {
                    var index = _poly.getLatLngs().length - 1;
                    _poly.spliceLatLngs(index , 1);
                    _poly.addLatLng(e.latlng);
                } else {
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
            if (callback != null) {
                //callback((angular.fromJson(_poly.toGeoJSON())).geometry.coordinates, _poly.getLatLngs());
                callback(_poly.getLatLngs());
            }
        }
    }

    /**
     *
     * @param map
     * @des清除地图图层
     */
    returnF.clearAllLayer = function (_map) {
        _map.eachLayer(function(layer){
            if (!(layer instanceof EzServerClient.TileLayer)) {
                this.removeLayer(layer);
            }
        },_map);
    };


    /**
     * @param map 地图对象
     * @param pointArr<Array> 撒点数据，每个数据需要有x,y属性
     * @param markerPicture 撒点图标，如果为null，使用地图默认图标
     * @param width<Number> 图标宽度，默认25
     * @param height<Number> 图标高度，默认25
     * @param clusterOptions<Object> 聚合参数设置，具体参考EzServerClient.markerClusterGroup
     * @param bindPopupFunc<Function> 绑定到图标的 popup函数，形式为 function( pointArr[i] )
     * @des 在地图上撒点
     */
    returnF.drawClusterMarkers = function (map, pointArr, markerPicture, width, heigth, clusterOptions, bindPopupFunc ) {
        var _markerPicture = arguments[2];
        var _width =  arguments[3] || 25;
        var _height =  arguments[4] || 25;
        var options = arguments[5] || {};
        var _bindPopupFunc = arguments[6];

        var layerGroup =  EzServerClient.markerClusterGroup( options );
        var length = pointArr.length;

        var markerIcon;

        if( _markerPicture ) {
            var CustomIcon = EzServerClient.Icon.extend({
                    options: {
                        iconUrl: markerPicture,
                        iconSize:     [_width, _height],
                        iconAnchor:   [_width/2, _height/2],
                        popupAnchor:  [ 0, _height/2]
                    }
                }
            );

            markerIcon = new CustomIcon;
        } else {
            markerIcon = new EzServerClient.Icon.Default();
        }


        var marker;
        for( var i=0; i<length; i++ ){
            var point = [];
            point[0] = pointArr[i].y || pointArr[i].Y;
            point[1] = pointArr[i].x || pointArr[i].X;

            if( _bindPopupFunc ){
                marker = new EzServerClient.Marker( point, {icon: markerIcon}).bindPopup( _bindPopupFunc(pointArr[i]) );
            }else{
                marker = new EzServerClient.Marker( point, {icon: markerIcon});
            }
            layerGroup.addLayer(marker);
        }

        layerGroup.addTo(map);
        return layerGroup;
    };

    return returnF;
}]);