/**
 * Created by qiansheng on 2015/5/26.
 *
 */

var authModule = angular.module("baseServiceModule");

/**
 * @des 对已经存在的用户进行监视
 */
authModule.factory("Auth", function() {
    var _user = sessionStorage.getItem("user");
    var uuid = function() {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }();

    var setUser = function () {
        _user = uuid;
        sessionStorage.setItem("user", _user);
    }

    return {
        setUser:setUser,
        isLoginedIn: function() {
            return _user ? true : false;
        },
        getUser: function() {
            return _user;
        },
        logout: function() {
            sessionStorage.removeItem("user")
            _user = null;
        }
    }

});





































