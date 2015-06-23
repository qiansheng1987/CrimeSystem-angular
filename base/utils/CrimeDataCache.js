/**
 * Created by qiansheng on 2015/6/16.
 */

var CrimeDataCache = (function(){

    function CrimeData() {
        this.data = {};
    }

    var unique;
    function getInstance(){
        if( unique === undefined ){
            unique = new CrimeData();
        }
        return unique;
    }

    return {
        getInstance : getInstance
    }
})();
