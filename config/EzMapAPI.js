ezMap = {
		MapSrcURL:[
					["shijie","http://172.18.68.81:7001/EzServer6_v6.6.4.201111111010/Maps/shijie/EzMap?Service=getImage&Type=RGB&ZoomOffset=0&Col={x}&Row={y}&Zoom={z}&V=0.3",{
	               		crs :"Ez",
	               		isEzMap : true
	               	}]
	              ],


		layersControlStyle: 1,
		//CenterPoint:[117.23437,31.8212828125],
		//CenterPoint:[114.523807,38.046912],
		CenterPoint:[119.94238,31.77246],
//		CenterPoint:[114.4768,38.0583],

		MapFullExtent: [
			[31, 119],
			[32, 121]
		],


		MapInitLevel: 14,


		MapMaxLevel: 18,


		MapMinLevel: 2,

		/**
		 *锟斤拷锟斤拷说锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷片锟斤拷图锟斤拷始锚锟姐，目前锟斤拷锟斤拷准锚锟斤拷为锟斤拷锟较斤拷为原锟姐（false锟斤拷锟斤拷锟侥诧拷锟斤拷锟斤拷锟斤拷支锟斤拷EzServer锟较版本锟斤拷图锟斤拷片锟斤拷锚锟斤拷锟斤拷锟轿�0,0]锟斤拷true锟斤拷
		 *锟斤拷锟斤拷锟斤拷锟酵ｏ拷bool
		 *取值锟斤拷围锟斤拷{锟斤拷锟斤拷锟斤拷}
		 *默锟斤拷值锟斤拷true EzServer锟斤拷图
		 *锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟绞�
		 */
		TileAnchorPoint: true,

		/**
		 *锟斤拷锟斤拷说锟斤拷锟斤拷锟斤拷锟矫碉拷图锟斤拷锟较碉拷锟斤拷停锟斤拷锟轿筹拷锟斤拷锟斤拷系为1锟斤拷锟截凤拷锟斤拷锟绞蔽�14699
		 *锟斤拷锟斤拷锟斤拷锟酵ｏ拷{Int}
		 *取值锟斤拷围锟斤拷锟斤拷锟斤拷锟斤拷
		 *默锟斤拷值锟斤拷锟斤拷
		 *锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟绞�
		 */
		MapCoordinateType: 1
};

/**###############################################################################**/

/** --------------------------------锟斤拷锟节碉拷图锟斤拷锟斤拷锟斤拷锟�-end-----------------------------**/



// 锟斤拷锟斤拷锟揭�拷锟�zMapAPI.js锟皆讹拷锟斤拷锟斤拷 锟斤拷图锟斤拷锟�EzServerClient.js锟斤拷蚩�丝锟斤拷锟�
//DO_LOAD_EzServerClient_JS = true;

//锟斤拷锟斤拷锟斤拷锟�zServerClient.GlobeParams.EzGeoPSURL锟侥碉拷址锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷锟铰脚憋拷
//document.writeln("<script type='text/javascript' charset='GB2312' src='" + EzServerClient.GlobeParams.EzGeoPSURL + "/ezgeops_js/EzGeoPS.js'></script>");


/**###############################################################################**/
/** --------------------------------锟诫不要锟睫革拷锟斤拷锟斤拷锟斤拷锟斤拷-----------------------------**/
/*if( DO_LOAD_EzServerClient_JS )
(function() {
	var scriptName = "EzMapAPI\\.js";
	var jsfiles = ["EzServerClient.gzjs"];

	var scriptObject = null;
	var scriptBaseURL = null; 
	
	(function () {
		var isOL = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)");
		var scripts = document.getElementsByTagName('script');
		for (var i=0, len=scripts.length; i<len; i++) {
			var src = scripts[i].getAttribute('src');
			if (src) {
				var match = src.match(isOL);
				if(match) {
					scriptBaseURL = match[1];
					scriptObject = scripts[i];
					break;
				}
			}
		}
	})();

	var detectAgent = function detectAgent(){
		var Agent = {};
        var ua = window.navigator.userAgent.toLowerCase();
        if (!!window.ActiveXObject||"ActiveXObject" in window){
        	if( /MSIE\s(\d+)/.test(ua) ){
        		Agent.ie = ua.match(/msie ([\d.]+)/)[1];
        	}else if( /rv\:(\d+)/.test(ua)){
        		Agent.ie = ua.match(/rv\:([\d.]+)/)[1];
        	}
        	
        } else if (isFirefox=navigator.userAgent.indexOf("Firefox")>0){
        	Agent.firefox = ua.match(/firefox\/([\d.]+)/)[1];
            HTMLElement.prototype.insertAdjacentElement=function(where,parsedNode){ 
                switch(where){ 
                    case "beforeBegin": 
                        this.parentNode.insertBefore(parsedNode,this); 
                        break; 
                    case "afterBegin": 
                        this.insertBefore(parsedNode,this.firstChild); 
                        break; 
                    case "beforeEnd": 
                        this.appendChild(parsedNode); 
                        break; 
                    case "afterEnd": 
                        if(this.nextSibling) 
                            this.parentNode.insertBefore(parsedNode,this.nextSibling); 
                        else 
                            this.parentNode.appendChild(parsedNode); 
                        break; 
                    } 
                }
        }
        	
        else if (window.MessageEvent && !document.getBoxObjectFor)
        	Agent.chrome = ua.match(/chrome\/([\d.]+)/)[1];
        else if (window.opera)
        	Agent.opera = ua.match(/opera.([\d.]+)/)[1];
        else if (window.openDatabase)
        	Agent.safari = ua.match(/version\/([\d.]+)/)[1];
        return Agent;
	};
	
	var addScript = function(src,charset){
		document.writeln("<script type=\"text/javascript\" charset=\""+charset+"\" src=\""+src+"\"></script>");
	};
	
	if( scriptBaseURL != null )
	for (var i=0, len=jsfiles.length; i<len; i++) {
		addScript( scriptBaseURL + jsfiles[i],"GB2312" );
	}
})();*/
/** --------------------------------锟诫不要锟睫革拷锟斤拷锟斤拷锟斤拷锟斤拷-----------------------------**/