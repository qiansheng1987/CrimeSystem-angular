/**
 * Created by Administrator on 2015/5/19.
 */
    this.uMap.getContainer().style.cursor = 'crosshair';
    var _drawing = true;
    var output = callback;
    var _poly = new EzServerClient.Polyline([],{
        weight: 3,
        opacity: 0.8,
        color:"#517CB7",
        dashArray: "10,10"
    });
    _poly.addTo(this.uMap);
    var that = this;

    this.uMap.on("click", _measureClick);
    this.uMap.on("contextmenu", _measureContextmenu);
    this.uMap.on("mousemove", _measureMove);

    /**
     * measure event method
     */
    function _measureClick(e){
        if (_drawing) {
            _poly.addLatLng(e.latlng);
        }
    }
    function _measureMove(e){
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
    function _measureContextmenu(){
        that.uMap.getContainer().style.cursor = '';
        _drawing = false;
        that.uMap.off("click", _measureClick);
        that.uMap.off("mousemove", _measureMove);
        var index = _poly.getLatLngs().length - 1;
        _poly.spliceLatLngs(index , 1);
        that.uMap.off("contextmenu", _measureContextmenu);

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
        output(distanceStr);

    }
