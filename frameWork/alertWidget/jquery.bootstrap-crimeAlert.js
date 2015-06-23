/**
 * Created by qs on 2015/5/14.
 */

+function($){

    var CrimeAlert = function(options){
        this.options = options;

        this.$modal = this.makeModal(options);
    };

    CrimeAlert.DEFIN = {
        event: {
            ok: 'ok.crime-alert',
            cancel: 'cancel.crime-alert'
        }
    };

    CrimeAlert.DEFAULTS = {
        autoShow: true,
        closeButton: true,
        useCancelButton: false
    }

    CrimeAlert.prototype.createModalId = function(){
        var uuid = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });

        var modalId = 'crime-alert-' + uuid;
        return modalId;
    }

    CrimeAlert.prototype.makeModal = function(options){
        var options = this.options;
        var modalId = this.createModalId();

        options.modalId = modalId;

        var title = options.title;
        var content = options.content ? options.content : '';

        // ---------------- Modal Main Div ----------------
        var $modalDiv = $('<div></div>')
            .attr('id', modalId)
            .attr('tabindex', '-1')
            .attr('role', 'dialog')
            .attr('aria-labelledby', title)
            .attr('aria-hidden', 'true')
            .attr('data-pure-altert', 'main')
            .addClass("modal fase")
            .appendTo($(document.body));

        var $modalDialogDiv = $('<div></div>')
            .addClass('modal-dialog')
            .addClass("modal-sm") //小窗口
            .appendTo($modalDiv);

        var $modalContentDiv = $('<div></div>')
            .addClass('modal-content')
            .appendTo($modalDialogDiv);

        // ---------------- Modal Header ----------------
        var $modalHeaderDiv = $('<div></div>')
            .addClass('modal-header')
            .addClass("btn-info")
            .css("height", "38px") //
            .appendTo($modalContentDiv);

        // Close Header
        if(options.closeButton){
            $('<button>x</button>')
                .attr('type', 'button')
                .attr('data-crime-alert-button', 'cancel')
                .attr('aria-hidden', 'true')
                .css("position", "absolute")//
                .css("right","8px")//
                .css("top", "6px") //
                .addClass('close')
                .appendTo($modalHeaderDiv);
        }

        // title
        $('<h4></h4>')
            .addClass('modal-title')
            .html(title)
            .css("position","absolute")
            .css("padding","5")
            .css("top","0")
            .css("left", "3")
            .appendTo($modalHeaderDiv);

        // ---------------- Modal Body ----------------
        $('<div></div>')
            .addClass('modal-body')
            .css({'word-break': 'break-all'})
            .html(content)
            .appendTo($modalContentDiv);

        // ---------------- Modal Footer ----------------
        var $modalFooterDiv = $('<div></div>')
            .addClass('modal-footer')
            .css("position","relative")// 新增
            .css("height", "40px") //
            .appendTo($modalContentDiv);

        // Cancle Button
        if(options.useCancelButton){
            $('<button></button>')
                .attr('type', 'button')
                .addClass("btn-sm")
                .attr('data-crime-alert-button', 'cancel')
                .attr('aria-hidden', 'true')
                .addClass('btn btn-default') //
                .css("position", "absolute") //
                .css("top","4px") //
                .css("right","80px") //
                .html(options.cancelBtn)
                .appendTo($modalFooterDiv);
        }
        // Ok Button
        $('<button></button>')
            .attr('type', 'button')
            .addClass("btn-sm")
            .attr('data-crime-alert-button', 'ok')
            .attr('aria-hidden', 'true')
            .html(options.okBtn)
            .addClass('btn btn-primary') //
            .css("position", "absolute") //
            .css("top","4px") //
            .css("right","15px") //
            .appendTo($modalFooterDiv);

        /***************************************************************************/
        // Modal Default option Setting
        var modalOption = {
            keyboard: false // ESC
            ,backdrop: 'static' //
            ,show: options.autoShow
        };

        // Jquery Dialog
        var $modal = $('#' + modalId);

        // Bootstrap Modal Setting
        $modal.modal(modalOption);

        // Modal的hide结束后Event运行
        $modal.on('hidden.bs.modal', function(e){
            if($modal.data('crime-alert-click-event') === 'destroy'){
                // Modal Element 清除
                $modal.remove();
            }
        });

        return $modal;
    }

    // method
    CrimeAlert.prototype.show = function(){
        this.$modal.modal('show');
    }

    CrimeAlert.prototype.hide = function(){
        this.$modal.modal('hide');
    }

    CrimeAlert.prototype.destroy = function(){
        this.$modal.data('crime-alert-click-event', 'destroy');
        this.$modal.modal('hide');
    }

    // Button Event
    CrimeAlert.prototype.eventTrigger = function(type){
        var eventFunc = this.options[type];
        if(typeof eventFunc === 'function'){
            eventFunc();
        }

        this.$modal.trigger($.Event(CrimeAlert.DEFIN.event[type]));
    }


    /**
     * Crime Alert - Plug-in Definition.
     */

    $.crimeAlert = function(options){
        var options = $.extend(true, {}, CrimeAlert.DEFAULTS, $.crimeAlert.defaultName, typeof options == 'object' && options);
        if(typeof options == 'string'){
            var content = options;
            options['content'] = content;
        }

        var data = new CrimeAlert(options);

        data.$modal.data('pure.crimeAlert', data);

        return data.$modal;
    };

    $.extend($.crimeAlert, {
        alert: function(options){
            return $.crimeAlert(options);
        },

        confirm: function(options){
            if(!options) options = {};
            options.useCancelButton = true;

            return $.crimeAlert(options);
        },

        defaultName: {
            title: '通知',
            okBtn: '确认',
            cancelBtn: '取消'
        }
    });

    $.fn.crimeAlert = function(method){
        var $this = $(this);

        var data = $this.data('pure.crimeAlert');
        if(!data){return;}
        if(typeof method == 'string') data[method]();

        return $this;
    }

    /**
     * Crime Alert - Event
     */

    $(document).on('click', '[data-crime-alert-button]', function(){
        var $this = $(this);
        var $modal = $this.closest('[data-pure-altert="main"]');

        var buttonType = $this.data('crime-alert-button');
        var data = $modal.data('pure.crimeAlert');
        data['eventTrigger'](buttonType);

        $modal.data('crime-alert-click-event', 'destroy');
        $modal.modal('hide');
    });

}(jQuery);