/**
 * Created by qiansheng on 2015/4/15.
 */
var serviceModule = angular.module("baseServiceModule", []);

serviceModule.factory("serviceFactory", ["$http", function ($http) {
	
    var doRequest = function (opid, userid, param) {
    	var paramStr = '{opid:"' + opid + '",userid:"' + userid + '",params:"' + param + '"}';
    	var path = _angular_serviceUrl +"?jsonstr=" + paramStr + "&CALLBACK=JSON_CALLBACK&JSONP=true";
    	return $http({method: "jsonp", url:path});
    };
    
    return {
    	//采用angular的jsonp方式请求
        getDataListByJsonp: function (opid, userid, param) {
            return doRequest(opid, userid, param);
        },
        
        //使用原生ajax请求
        getDataListByXhr: function (opid, userid, param, callback, method) {
            var AngularAjax = new AjaxMain();
            AngularAjax.setClientUrl(_angular_clientUrl);
            AngularAjax.setServiceUrl(_angular_serviceUrl);
            AngularAjax.sendRequest(opid, userid, param,callback,method);
        },
        
        //采用rest风格调用
        getDataListByRest: function(path) {
        	return $http({method: "get", url:path});
        }
    };

    function AjaxMain() {
        this.serviceurl = "";
        this.clienturl = "";
        this.setServiceUrl = function(serviceurl) {
            this.serviceurl = serviceurl;
        };
        this.setClientUrl = function (url) {
            this.clienturl = url;
        };
        //发送请求函数
        this.sendRequest = function (opid, userid, param, callback, method) {
            if (this.clienturl == null || this.clienturl.length == 0) {
                alert("请设置客户端请求的url地址");
                return;
            }
            var b = new sendAjax();
            b.send(this.serviceurl, this.clienturl, opid, userid, param, method, callback);
        };
    }

    function sendAjax() {
        this.callback = null;
        this.XMLHttpReq = null;
        var self_ = this;
        //创建XMLHttpRequest对象
        this.createXMLHttpRequest = function () {
            if (window.XMLHttpRequest) { //Mozilla 浏览器
                this.XMLHttpReq = new XMLHttpRequest();
            }
            else if (window.ActiveXObject) { // IE浏览器
                try {
                    this.XMLHttpReq = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        this.XMLHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e) {
                    }
                }
            }
        };
        this.createXMLHttpRequest();
        this.send = function (serviceurl, clienturl, opid, userid, param, method, callback) {
            this.callback = callback;
            var url = serviceurl;
            var params = "";
            //'{opid:"poservice.public.organization.getonestepzzjg",userid:"admin"}'
            if (param != null && param.length > 0) {
                params = '{opid:"' + opid + '",userid:"' + userid + '",params:' + param + '}';
            } else {
                params = '{opid:"' + opid + '",userid:"' + userid + '",params:""}';
            }

            if (!method) {
                method = "GET";
            }
            this.method = method.toUpperCase();
            var a = clienturl.split("/");
            var b = clienturl.substring(0, clienturl.indexOf(a[a.length - 1]));
            var c = serviceurl.split("/");
            var d = serviceurl.substring(0, serviceurl.indexOf(c[c.length - 2]));
            if (method.toUpperCase() == "POST" && b.indexOf(d) == -1) {
                var urlsend = "url=" + encodeURIComponent(serviceurl) + "&xml=" + encodeURIComponent(escape(params)) + "&time=" + new Date().getTime();
                this.XMLHttpReq.open(method, clienturl + "/Proxy", true);
                this.XMLHttpReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
                this.XMLHttpReq.onreadystatechange = function () {
                    if (self_.XMLHttpReq.readyState == 4) { // 判断对象状态
                        if (self_.XMLHttpReq.status == 200) { // 信息已经成功返回，开始处理信息
                            var res = unescape(self_.XMLHttpReq.responseText);
                            var json = eval("(" + res + ")");
                            self_.callback(json, json.success, json.message);
                        }
                    }
                };//指定响应函数
                this.XMLHttpReq.send(urlsend);  // 发送请求
            } else {
                url += "?jsonstr=" + escape(params);
                this.XMLHttpReq.open(method, url, true);
                this.XMLHttpReq.onreadystatechange = function () {
                    if (self_.XMLHttpReq.readyState == 4) { // 判断对象状态
                        if (self_.XMLHttpReq.status == 200) { // 信息已经成功返回，开始处理信息
                            var res = unescape(self_.XMLHttpReq.responseText);
                            var json = eval("(" + res + ")");
                            self_.callback(json, json.success, json.message);
                        }
                    }
                };//指定响应函数
                this.XMLHttpReq.send("jsonstr=" + escape(params));  // 发送请求
            }
        };
        
        //编码
        this.encode = function (str) {
            if (str == null || str.length == 0) {
                return null;
            }
            return escape(str);
        };
        
        //解码
        this.decode = function (str) {
            if (str == null || str.length == 0) {
                return null;
            }
            return unescape(str);
        };
    }
}]);