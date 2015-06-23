/**
 * Created by Administrator on 2015/5/5.
 */

var compileModel = angular.module("compileModel", []);

/**
 * 注意如果有compile函数angualr就不会执行link函数，两个只能有一个
 * conpile函数的作用是对指令的模板进行转换
 * link函数的作用是在模型和试图之间建立关联，包括在元素上注册事件监听。
 * scope在链接阶段才会绑定到元素上，因此compile阶段操作scope会报错。
 * 对于同一个指令的多个实例，compile智慧执行一次，而link对于指令的每一个实例都会执行一次。
 * 一般情况下我们只要编写link函数就够了
 * 注意，如果编写的自定义的compile函数，自定义的link函数无效，因为compile函数返回一个link函数供后续处理
 */
compileModel.directive("hello", function () {
    return {
        restrict: "A",
        transclude : true,
        template: "<div ng-transclude>Hi everyone</div>",

        compile: function (el, attrs, transculde) {
            console.log("指令编译.....");
            var tpl = el.children().clone();
            console.log(tpl);
            for (var i = 0; i < attrs.hello - 1; i++) {
                el.append(tpl.clone());
            }
            return function (scope, el, attrs, controller) {
                el.on("mouseenter", function () {
                    console.log("鼠标进入");
                });
            }
        },
        link: function(scope, el, attrs, controller) {
            console.log("只是我自己的link.......");
        }
    }
});

/*
* 指令的控制器和link函数可以相互的互换，控制器主要事用来提供可在指令在复用的行为，
* 但链接函数只能在当前内部指令中定义行为，且无法在指令间复用
* */






































