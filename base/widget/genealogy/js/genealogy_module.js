/**
 * 层级选择模块，使用与 警情类型选择、案件类型选择、组织机构选择
 * Created by YP on 2015-05-28.
 */

var genealogyModule = angular.module('ez.genealogy', ['baseServiceModule']);
genealogyModule.controller('JQLBController', ['$scope', 'baseDataService', function ($scope, baseDataService) {

    ezCrimeData.jqlb = $scope.jqlb = {
        dataJson: {}, /* json格式的数据*/
        id2name: {},
        id2level: {},
        dataList: []/* list格式的数据 */
    };

    /* 为嵌套指令定义的属性，需要定义在this上*/
    this.dataInfo = {
        dataJson: {},
        dataList: {}
    }
    var self = this;
    this.titleStr = "警情类型";
    this.dataType = 'jqlb';

    /*
     * 从数据库获取警情类别数据
     * */
    $scope.getJqlb = this.getData = function () {
        return baseDataService.getJqlb().then(function (data) {
            if (data.status == 200) {
                if (data.data.success) {
                    var xmlDoc = $.parseXML(data.data.resultJson);
                    var dataJson = xmlToJson(xmlDoc).node;
                    self.dataInfo.dataJson = $scope.jqlb.dataJson = dataJson;

                    parseJqlb(dataJson, $scope.jqlb.id2name, $scope.jqlb.id2level);
                }
            }
            /*案件解析
             var dataObj = angular.fromJson( unescape(data) );
             if(dataObj.success){
             var xmlDoc = $.parseXML( dataObj.resultJson );
             var dataJson = xmlToJson( xmlDoc );
             console.log(dataJson);
             }*/
        });
        //todo 是否在genealogy的link之前执行
        /*console.log(" 执行JQLBController的定义");
         $scope.getJqlb();*/
    };

    /*
     * 解析警情类别数据，设置'id' to 'name', 'id' to 'lebel' 的映射;
     * 设置搜索数据源
     * */
    function parseJqlb(node, id2name, id2level) {
        var nodelist = [];
        if (Array.isArray(node)) {
            nodelist = node;
        } else {
            nodelist = [node];
        }

        $scope.jqlb.dataList = $scope.jqlb.dataList.concat(nodelist);
        self.dataInfo.dataList = $scope.jqlb.dataList;

        for (var i = 0; i < nodelist.length; i++) {
            id2name[nodelist[i]['@attributes']['id']] = nodelist[i]['@attributes']['name'];
            id2level[nodelist[i]['@attributes']['id']] = nodelist[i]['@attributes']['level'];
            if (nodelist[i].node) {
                parseJqlb(nodelist[i].node, id2name, id2level);
            }
        }
    }

}]);


genealogyModule.directive('jqlb', function () {
    return {
        restirct: 'EA',
        replace: true,
        transclude: true,
        controller: 'JQLBController',
        template: '<div ng-transclude=""></div>'

    }
});

genealogyModule.directive('genealogy', ['$animate', '$timeout', function ($animate, $timeout) {
    return {
        restrict: 'EA',
        replace: true,
        require: ['?^zzjg', '?^jqlb'],
        templateUrl: 'base/widget/genealogy/tpls/genealogy.html',
        controller: 'GenealogyController',
        link: function (scope, element, attrs, superCtrl) {
            //scope: 就是controller属性所指向的控制器中的$scope
            // superCtrl: 可以访问父控制器（require指向的对象）中定义在this上的方法，而不是$scope上的方法
            var self = $(element);
            console.log('genealogy directive link');
            scope.$on('close', function (event, pData) {
                $( attrs.parentdiv).css( 'display', 'none');
            });

            var superCtrlFirstApposite = null;
            if (Array.isArray(superCtrl)) {
                for (var i = 0; i < superCtrl.length; i++) {
                    if (superCtrl[i]) {
                        superCtrlFirstApposite = superCtrl[i];
                        break;
                    }
                }
            } else {
                superCtrlFirstApposite = superCtrl;
            }

            superCtrlFirstApposite.getData().then(function (pa, pb, pc, pd) {
                scope.viewData.firstLevelData = Array.isArray(superCtrlFirstApposite.dataInfo.dataJson.node)
                    ? superCtrlFirstApposite.dataInfo.dataJson.node : [superCtrlFirstApposite.dataInfo.dataJson.node];

                scope.searchSourceDatas.sourceData = superCtrlFirstApposite.dataInfo.dataList;
            });

            scope.titleStr = superCtrlFirstApposite.titleStr;
            scope.dataType = superCtrlFirstApposite.dataType;

            /* 元素被移除后，更新checkbox */
            scope.$on('itemRemoved', function (event, pItemRemoved)
            {
                event.stopPropagation();
                var items = self.find('.genealogy-body li');
                self.find('.genealogy-body li').each( function(pIndex, pEle){
                    var $that = $(pEle);
                    var itemdata = $that.data('itemdata');
                    if (itemdata && itemdata === pItemRemoved) {
                        $that.find('i').removeClass('fa-check-square-o');
                        $that.find('i').addClass('fa-square-o');
                    }
                });
            });

            //点击checkbox隐藏该类别的下级 并设置'.genealogy-body-state2.first-level-panel-state2'包含的元素的选中态（在选择'.genealogy-body-state1'的元素时）
            scope.$on( 'hiddenSubLevel', function (event, pEle) {
                event.stopPropagation();
                //点解checkbox隐藏该类别的下级
                var timeoutDelay = 0;
                var removeList = [];

                if ($.contains(self.find('.genealogy-body-state2.first-level-panel-state2')[0], pEle)) {
                    removeList = [ 4, 3, 2 ];
                    /*self.find('.genealogy-body-state2.second-level-panel-state2').css('visibility', 'hidden');
                    self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'hidden');
                    self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');*/
                }
                if ($.contains(self.find('.genealogy-body-state2.second-level-panel-state2')[0], pEle)) {
                    removeList = [4, 3];
                    /*self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'hidden');
                    self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');*/
                }
                if ($.contains(self.find('.genealogy-body-state2.third-level-panel-state2')[0], pEle)) {
                    removeList = [4];
                    /*self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');*/
                }

                for(var i = 0; i < removeList.length; i++ ){
                    switch (removeList[i]){
                        case 4:
                            $timeout(function () {
                                $animate.removeClass(self.find('.genealogy-body-state2.forth-level-panel-state2'), 'forth-level-leftin');
                            }, timeoutDelay);
                            timeoutDelay += 500;
                            break;
                        case 3:
                            $timeout(function () {
                                $animate.removeClass(self.find('.genealogy-body-state2.third-level-panel-state2'), 'third-level-leftin');
                            }, timeoutDelay);
                            timeoutDelay += 500;
                            break;
                        case 2:
                            $timeout(function () {
                                $animate.removeClass(self.find('.genealogy-body-state2.second-level-panel-state2'), 'second-level-leftin');
                            }, timeoutDelay);
                            timeoutDelay += 500;
                            break;
                    }
                }

            });

            scope.$on('_handlerRelatively', function (event, p) {
                event.stopPropagation();

                if ($.contains(self.find('.genealogy-body-state1 .first-level-main')[0], p.pEle)) {
                    self.find('.genealogy-body-state2.first-level-panel-state2 li').each(function (oIndex, oEle) {
                        var $that = $(oEle);
                        var itemdata = $that.data('itemdata');
                        if (itemdata && itemdata === p.pData) {
                            $that.find('i').toggleClass('fa-check-square-o');
                            $that.find('i').toggleClass('fa-square-o');
                            return false;
                        }
                    });

                }
            });

            scope.doFirstLevelFromState1ToState2 = function ($event) {
                scope.viewData.firstLevelTitle = scope.titleStr;
                scope.viewData.secondLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                scope.viewData.secondLevelTitle = this.item['@attributes']['name'];
                //使用ngAnimate添加动画
                // todo尝试使用then方法解决动画的连播
                /*$animate.addClass(self.find('.genealogy-body-state1'), 'leave-right')
                    .then(function () {
                        return scope.$apply(function () {
                            return $animate.addClass(self.find('.genealogy-body-state2.first-level-panel-state2'), 'first-level-leftin');
                        });
                    })
                    .then(function () {
                         scope.$apply(function () {
                             $animate.addClass(self.find('.genealogy-body-state2.second-level-panel-state2'), 'second-level-leftin');
                        });
                    });
                */
                $animate.addClass(self.find('.genealogy-body-state1'), 'leave-right')
                    .then(function () {
                        return scope.$apply(function () {
                            return $animate.addClass(self.find('.genealogy-body-state2.first-level-panel-state2'), 'first-level-leftin');
                        });
                    });
                $timeout(function () {
                    $animate.addClass(self.find('.genealogy-body-state2.second-level-panel-state2'), 'second-level-leftin');
                }, 2000);


            };

            scope.toSecondLevel = function ($event) {
                /*self.find('.genealogy-body-state2.second-level-panel-state2').css('visibility', 'hidden');
                if (this.item.node) {
                    scope.viewData.secondLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.secondLevelTitle = this.item['@attributes']['name'];
                    self.find('.genealogy-body-state2.second-level-panel-state2').css('visibility', 'visible');
                    self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'hidden');
                    self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');
                }*/
                if (this.item.node) {
                    scope.viewData.secondLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.secondLevelTitle = this.item['@attributes']['name'];
                    //self.find('.genealogy-body-state2.second-level-panel-state2').css('visibility', 'visible');

                    //self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'hidden');
                    //self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');
                    // 移除forth-level-panel-state2
                    var timeoutdelay = 0;
                    if( self.find('.genealogy-body-state2.forth-level-panel-state2').position().left > 0 ){
                        $animate.removeClass( self.find('.genealogy-body-state2.forth-level-panel-state2'), 'forth-level-leftin');
                        timeoutdelay += 1000;
                    }
                    // 移除third-level-panel-state2
                    if( self.find('.genealogy-body-state2.third-level-panel-state2').position().left > 0 ){
                        $timeout(function () {
                            $animate.removeClass( self.find('.genealogy-body-state2.third-level-panel-state2'), 'third-level-leftin');
                            timeoutdelay += 1000;
                        }, timeoutdelay);

                    }
                    // 移除second-level-panel-state2
                    if( self.find('.genealogy-body-state2.second-level-panel-state2').position().left < 0 ){
                        $timeout(function () {
                            $animate.addClass( self.find('.genealogy-body-state2.second-level-panel-state2'), 'second-level-leftin');
                            timeoutdelay += 1000;
                        }, timeoutdelay);
                    }
                }else{
                    if (self.find('.genealogy-body-state2.second-level-panel-state2').position().left > 0) {
                        $animate.removeClass(self.find('.genealogy-body-state2.second-level-panel-state2'), 'second-level-leftin');
                    }
                }


            };

            scope.toThirdLevel = function ($event) {
                /*self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'hidden');
                if (this.item.node) {
                    scope.viewData.thirdLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.thirdLevelTitle = this.item['@attributes']['name'];
                    self.find('.genealogy-body-state2.third-level-panel-state2').css('visibility', 'visible');
                    self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');
                }*/
                if (this.item.node) {
                    scope.viewData.thirdLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.thirdLevelTitle = this.item['@attributes']['name'];
                    // 移除third-level-panel-state2
                    var timeoutdelay = 0;
                    if( self.find('.genealogy-body-state2.forth-level-panel-state2').position().left > 0 ){
                        $timeout(function () {
                            $animate.removeClass( self.find('.genealogy-body-state2.forth-level-panel-state2'), 'forth-level-leftin');
                            timeoutdelay += 1000;
                        }, timeoutdelay);

                    }
                    var aaa = self.find('.genealogy-body-state2.third-level-panel-state2');
                    var bbb = aaa.position().left;
                    if( self.find('.genealogy-body-state2.third-level-panel-state2').position().left < 0 ){
                        $timeout(function () {
                            $animate.addClass( self.find('.genealogy-body-state2.third-level-panel-state2'), 'third-level-leftin');
                            timeoutdelay += 1000;
                        }, timeoutdelay);
                    }
                }else{
                    $animate.removeClass( self.find('.genealogy-body-state2.third-level-panel-state2'), 'third-level-leftin');

                }
            }
            scope.toForthLevel = function ($event) {
                /*self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'hidden');
                if (this.item.node) {
                    scope.viewData.forthLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.forthLevelTitle = this.item['@attributes']['name'];
                    self.find('.genealogy-body-state2.forth-level-panel-state2').css('visibility', 'visible');
                }*/

                if (this.item.node) {
                    scope.viewData.forthLevelData = Array.isArray(this.item.node) ? this.item.node : [this.item.node];
                    scope.viewData.forthLevelTitle = this.item['@attributes']['name'];
                    if (self.find('.genealogy-body-state2.forth-level-panel-state2').position().left < 0) {
                        $animate.addClass(self.find('.genealogy-body-state2.forth-level-panel-state2'), 'forth-level-leftin');

                    }
                } else {
                    $animate.removeClass( self.find('.genealogy-body-state2.forth-level-panel-state2'), 'forth-level-leftin');

                }
            };

            scope.$on('_selectAll', function (event, pEle) {
                _changeStateOfCheckbox('.genealogy-body-state1 .first-level-main li', true );
                _changeStateOfCheckbox('.genealogy-body-state2.first-level-panel-state2 li', true );

                var eventTarget = $(pEle);
                eventTarget.find('i').removeClass('fa-square-o');
                eventTarget.find('i').addClass('fa-check-square-o');
                eventTarget.next().find('i').addClass('fa-square-o');
                eventTarget.next().find('i').removeClass('fa-check-square-o');

            });
            scope.$on('_unSelectAll', function (event, pEle) {
                _changeStateOfCheckbox('.genealogy-body-state1 .first-level-main li', false );
                _changeStateOfCheckbox('.genealogy-body-state2.first-level-panel-state2 li', false );

                var eventTarget = $(pEle);
                eventTarget.find('i').removeClass('fa-square-o');
                eventTarget.find('i').addClass('fa-check-square-o');
                eventTarget.prev().find('i').addClass('fa-square-o');
                eventTarget.prev().find('i').removeClass('fa-check-square-o');
            });

            function _changeStateOfCheckbox( selector, isChecked ){
                var teml = self.find(selector);
                self.find(selector).each(function (pIndex, pEle) {
                    var $that = $(pEle);
                    if (isChecked) {
                        $that.find('i').removeClass('fa-square-o');
                        $that.find('i').addClass('fa-check-square-o');
                    }else{
                        $that.find('i').removeClass('fa-check-square-o');
                        $that.find('i').addClass('fa-square-o');
                    }
                });

            }


        }
    }

}]);


genealogyModule.controller('GenealogyController', ['$scope', '$attrs','$filter', 'shareDataService',
    function ($scope,$attrs, $filter, shareDataService) {
        $scope.resultGenealogy = {
            listChecked: []
            /*  测试数据*/
            /*listChecked : ['刑事警情','抢劫','盗窃','纵火','吸毒''刑事警情','抢劫''盗窃','纵火','纵火','纵火','纵火','纵火','纵火','纵火','纵火','吸毒']*/
        };

        $scope.searchSourceDatas = {
            sourceData: [], /* 搜索数据源*/
            listData: [], /* 与输入匹配后的数据 */
            optsSeclected: [] /* 选中的数据*/
        };

        $scope.viewData = {
            firstLevelData: [],
            secondLevelData: [],
            thirdLevelData: [],
            forthLevelData: [],

            firstLevelTitle: "",
            secondLevelTitle: "",
            thirdLevelTitle: "",
            forthLevelTitle: ""
        }

        /*
         * 从已经选择的警情类型中移除元素
         * */
        $scope.removeFromCheckedList = function ($event) {
            var i = Array.prototype.indexOf.call($scope.resultGenealogy.listChecked, this.item)
            if (i > -1) {
                Array.prototype.splice.apply($scope.resultGenealogy.listChecked, [i, 1]);
            }

            //$scope.unCheckedRemovedItem(this.item);
            $scope.$emit('itemRemoved', this.item);
        };

        /*
         * 选中当前节点
         * */
        $scope.onCleckItem = function ($event) {
            var ele = $event.currentTarget;

            var eleJquery = $(ele);

            if (eleJquery.hasClass("fa-square-o")) {
                //添加至选中列表
                $scope.resultGenealogy.listChecked.push(this.item);//thisScope中传入的
            }

            if (eleJquery.hasClass("fa-check-square-o")) {
                //从选中列表中移除
                var i = Array.prototype.indexOf.call($scope.resultGenealogy.listChecked, this.item)
                if (i > -1) {
                    Array.prototype.splice.apply($scope.resultGenealogy.listChecked, [i, 1]);
                }

            }


            //点击checkbox隐藏该类别的下级
            $scope.$emit('hiddenSubLevel', eleJquery[0] );

            //在点击 .genealogy-body-state1 .first-level-main中的li时
            // .genealogy-body-state2.first-level-panel-state2
            $scope.$emit('_handlerRelatively', { pData: this.item, pEle: eleJquery[0] });

            eleJquery.toggleClass('fa-square-o');
            eleJquery.toggleClass('fa-check-square-o');
        };



        $scope.doSearchFilter = function () {
            alert("sfasf");
            var sertchStr = $scope.matchStr;
            if (sertchStr == '') {
                $scope.searchSourceDatas.listData = [];
            } else {

                $scope.searchSourceDatas.listData = $filter('matchInput')($scope.searchSourceDatas.sourceData, sertchStr);
            }
            console.log('列表候选项内容\n');
            console.log($scope.searchSourceDatas.listData);
            $('.operator select').click();
        };


        $scope.searchResultSelect = function () {
            console.log('当前下拉列表中选择的元素：\n' + $scope.searchSourceDatas.optsSeclected);
            if( $scope.searchSourceDatas.optsSeclected ){
                $scope.$emit('itemAdd', $scope.searchSourceDatas.optsSeclected);
            }
        };

        $scope.okBtnHandler = function () {
            //TODO 从父控制器中继承的属性
            //$scope.jqlbSelected = $scope.resultGenealogy.listChecked;
            //$scope.$emit('jqlbSelectedChange',  $scope.resultGenealogy.listChecked);

            var obj = { type: $scope.dataType, list: $scope.resultGenealogy.listChecked };
            hashMap.getInstance().put("selectedFocusJq", $scope.resultGenealogy.listChecked);

            $scope.updateData(  obj );
            $scope.close();
            var attrs = angular.fromJson($attrs);
            if (attrs.type == "jqlb_set") {
                $scope.$emit("showjqlbSetResult");
                return;
            } else if (attrs.type == "ajQuery") {
                $scope.$emit("ajGenealogyPopClose");
                return;
            }

            $scope.$emit('genealogyPopClose');

        };

        $scope.moreBtnHandler = function () {
            $('.genealogy-content .genealogy-header .list-checked').toggleClass('more');
        };

        //选中 firstLevel中的所有元素，并删除其他元素（ subLevel ）
        $scope.selectAllHandler = function( _event ){
            var _target = _event.currentTarget;
            $scope.resultGenealogy.listChecked.splice(0, $scope.resultGenealogy.listChecked.length);
            $scope.resultGenealogy.listChecked = $scope.resultGenealogy.listChecked.concat( $scope.viewData.firstLevelData );

            $scope.$emit('_selectAll', _target);
        };
        $scope.unSelectAllHandler = function( _event ){
            var _target = _event.currentTarget;
            $scope.resultGenealogy.listChecked.splice(0, $scope.resultGenealogy.listChecked.length);
            $scope.$emit('_unSelectAll', _target);
        };



        $scope.close = function () {
            $scope.$emit( 'close' );
        };


        /*
         定义事件来监控选择元素的变化
         * */
        $scope.$on('itemAdd', function (event, item) {
            item = Array.isArray(item) ? item : [item];
            item.forEach(function (x, index, a) {
                var i = $scope.resultGenealogy.listChecked.indexOf(x);
                if (i == -1) {
                    $scope.resultGenealogy.listChecked.push(x);
                }
            });

            $scope.$emit('updateView');
        });
        //更新视图
        $scope.$on('updateView', function () {
            console.log('must update view');
        });

        //20150615 qiansheng add begin 警情配置删除关注警情
        $scope.$on("deletefoucsJq", function (event, data) {
            var i = Array.prototype.indexOf.call($scope.resultGenealogy.listChecked, data)
            if (i > -1) {
                Array.prototype.splice.apply($scope.resultGenealogy.listChecked, [i, 1]);
            }
            $scope.$emit('itemRemoved', data);
        });
        
        $scope.$on("initfoucsJq", function (event, data) {
            var foucusJq = [];
            for (var i=0; i<data.length; i++) {
                var obj = data[i];
                var obj = {
                    "@attributes":{
                        id:obj.id,
                        name:obj.name,
                        level:obj.level
                    }
                };
                foucusJq.push(obj);
            }
            $scope.resultGenealogy.listChecked = foucusJq;
        });


        //20150615 qiansheng add end 警情配置删除关注警情

    }]);


/*
 * 给元素绑定数据
 * */
genealogyModule.directive('bindData', function () {
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, element, attrs, controller) {
            console.log('bind-data 指令 link function');
            $(element).data('itemdata', scope.item);//注意：itemdata为小写，这个angualr的坑
        }
    }

});



/*
 * 定义搜索时候的过滤器
 * */
genealogyModule.filter('matchInput', function () {
    return function (inputArr, matchStr) {
        var arr = [];
        for (var i = 0; i < inputArr.length; i++) {
            if (inputArr[i]['@attributes']['name'].indexOf(matchStr) > -1) {
                arr.push(inputArr[i]);
            }
        }
        return arr;
    }
});


//+++++++++++++++++++++++++++++++ 分割线 +++++++++++++++++++++++++++++++++++++++++++++++
// 组织机构相关
genealogyModule.controller('ZzjgController2',['$scope', 'baseDataService', function ($scope, baseDataService) {

    var self = this;
    this.titleStr = '组织机构';
    this.dataType = 'zzjg';

    ezCrimeData.zzjg = $scope.zzjg = {
        dataJson: {}, /* json格式的数据*/
        id2name: {},
        dataList: []/* list格式的数据 */
    };

    /* 为嵌套指令定义的属性，需要定义在this上*/
    this.dataInfo = {
        dataJson: {},
        dataList: {}
    }

    /*
     * 从数据库获取组织机构数据
     * */
    $scope.getZzjg = this.getData = function () {
        return baseDataService.getZzjg().then(function (data) {
            if (data.status == 200) {
                var temdata = unescape(data.data);
                var dataObj = angular.fromJson( unescape(data.data) );
                if (dataObj.success) {
                    var xmlDoc = $.parseXML(dataObj.resultJson);
                    var dataJson = xmlToJson(xmlDoc).node;
                    self.dataInfo.dataJson = $scope.zzjg.dataJson = dataJson;

                    parseZzjg(dataJson, $scope.zzjg.id2name);

                    console.log("end")
                }
            }
        });
    };

    function parseZzjg( node, id2name ){
        var nodelist = [];
        if (Array.isArray(node)) {
            nodelist = node;
        } else {
            nodelist = [node];
        }

        $scope.zzjg.dataList = $scope.zzjg.dataList.concat(nodelist);
        self.dataInfo.dataList = $scope.zzjg.dataList;

        for (var i = 0; i < nodelist.length; i++) {
            id2name[nodelist[i]['@attributes']['id']] = nodelist[i]['@attributes']['name'];
            if (nodelist[i].node) {
                parseZzjg(nodelist[i].node, id2name);
            }
        }
    }
}]);

genealogyModule.directive('zzjg', function () {
    return {
        restirct: 'EA',
        replace: true,
        transclude: true,
        controller: 'ZzjgController2',
        template: '<div ng-transclude=""></div>'
    }
});


//+++++++++++++++++++++++++++++++++++++++   分割线    +++++++++++++++++++++++++++++++
// 过滤器定义
// 返回name字段
jqQueryModule.filter('namesFilter', function () {
    return function (inputArr) {
        var arr = [];

        for (var i = 0; i < inputArr.length; i++) {
            arr.push( inputArr[i]['@attributes']['name'] );

        }
        return arr.join(',');
    }
});

/**
 * @des 返回选择的警情类别
 */

// 返回ID字段
jqQueryModule.filter('idFilter', function () {
    return function (inputArr) {
        var arr = [];

        for (var i = 0; i < inputArr.length; i++) {
            arr.push( inputArr[i]['@attributes']['id'] );

        }
        return arr.join(',');
    }
});

//生成组织机构where条件
// 分类 分局、市局、派出所
jqQueryModule.filter('zzjgCategoryFilter', function () {
    //todo 在这里可以添加更加详细的分类：（如果下级组织机构的上级已经加入，则不需要再添加该组织机构）不过当前的功能已经完整
    return function (zzjgArr) {
        var stArr = [];
        var sjArr = [];
        var fjArr = [];
        var pcsArr = [];
        var zzjg = {"st":stArr,"sj":sjArr,"fj":fjArr,"pcs":pcsArr};
        zzjg.isEmpty = true;
        if( zzjgArr && zzjgArr.length > 0 ){
            zzjg.isEmpty = false;
            for(var i=0; i<zzjgArr.length; i++ ){
                var x = zzjgArr[i];

                if( x['@attributes']["level"] == 10){
                    stArr.push( "'" + x['@attributes']["id"] + "'" );

                }else if( x['@attributes']["level"] == 11){
                    sjArr.push(  "'" + x['@attributes']["id"] + "'");

                }else if( x['@attributes']["level"] == 12){
                    //if( isContain(x.parent.data["zzjgdm"], sjArr) ){
                    //    continue;
                    //} else {
                    //    fjArr.push( x.data["zzjgdm"] );
                    //}
                    fjArr.push( "'" + x['@attributes']["id"] + "'" );
                }else if( x['@attributes']["level"] == 13){
                    //if( isContain(x.parent.data["zzjgdm"], fjArr) ){
                    //    continue;
                    //} else if( isContain(x.parent.parent.data["zzjgdm"], sjArr)  ){
                    //    continue;
                    //} else {
                    //    pcsArr.push( x.data["zzjgdm"] );
                    //}
                    pcsArr.push( "'"+x['@attributes']["id"]+"'" );
                }
            }
        }
        stArr.sort();
        sjArr.sort();
        fjArr.sort();
        pcsArr.sort();

        return zzjg;
    }
});
jqQueryModule.filter('zzjgWhereFilter', function () {
    return function (zzjgObj) {
        var where = '';

        if( !zzjgObj.isEmpty){
            if( zzjgObj.sj && zzjgObj.sj.length > 0 ){
                where +="t.ssgajdm in ( "+zzjgObj.sj.join(",")+" ) ";
            }

            if( zzjgObj.fj && zzjgObj.fj.length!=0 ){
                where +=" or t.ssgafjdm in ( "+zzjgObj.fj.join(",")+" )";
            }

            if( zzjgObj.pcs && zzjgObj.pcs.length!=0 ){
                where +="  or t.sspcsdm in ( "+zzjgObj.pcs.join(",")+" )";
            }
            where = String.prototype.trim.call(where);
            if(where.indexOf("or") == 0){
                where = where.substring(2);
            }
        }
        return where;
    }
});

//分类警情： 大类代码、中类代码、小类代码、微类代码
jqQueryModule.filter('jqlbCategoryFilter', function () {
    return function (jqlbArr) {
        var dldmArr = [];
        var zldmArr = [];
        var xldmArr = [];
        var wldmArr = [];
        var jqObj = { "dldm": dldmArr, "zldm": zldmArr, "xldm": xldmArr, "wldm": wldmArr };

        if ( jqlbArr && jqlbArr.length > 0 )
        {
            for ( var i = 0; i < jqlbArr.length; i++ )
            {
                var o = jqlbArr[i]['@attributes'];
                switch ( o.level )
                {
                    case "1":
                    {
                        dldmArr.push( "'" + o.id + "'" );
                        break;
                    }
                    case "2":
                    {
                        zldmArr.push(  "'" + o.id + "'"  );
                        break;
                    }
                    case "3":
                    {
                        xldmArr.push(  "'" + o.id + "'"  );
                        break;
                    }
                    case "4":
                    {
                        wldmArr.push(  "'" + o.id + "'" );
                        break;
                    }
                }

            }
        }
        return jqObj;
    }
});
// 生成警情类别查询where条件
genealogyModule.filter( 'jqlbWhereFilter', function () {
    return function (jqlbObj) {
        var where = '';
        if (jqlbObj) {
            if ((jqlbObj.dldm && jqlbObj.dldm.length != 0)) {
                where += "t.dldm in (" + jqlbObj.dldm.join(",") + ")";
            }

            if (jqlbObj.zldm && jqlbObj.zldm.length != 0) {
                where += " or t.zldm in (" + jqlbObj.zldm.join(",") + ")";
            }

            if (jqlbObj.xldm && jqlbObj.xldm.length != 0) {
                where += " or t.xldm in (" + jqlbObj.xldm.join(",") + ")";
            }

            if (jqlbObj.wldm && jqlbObj.wldm.length != 0) {
                where += " or t.wldm in (" + jqlbObj.wldm.join(",") + ")"
            }

            where = String.prototype.trim.call(where);
            if (where.indexOf("or") == 0) {
                where = where.substring(2);
            }
        }
        return where;
    }
});

