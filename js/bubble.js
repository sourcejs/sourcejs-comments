/**
 * Created by Alexey Ostrovsky, Gennady Tsarinny
 * Date: 04.03.14
 * Time: 19:57
 */
"use strict";

define([
    "jquery",
    "core/options",
    "modules/module",
    "modules/innerNavigation",
    "modules/css",
    "text!plugins/bubble/templates/bubble.html"
    ], function ($, opt, module, innerNavigation, css, template) {

        var moduleCss = new css("bubble/bubble.css");
        
        function Bubble() {

            var _this = this;

            this.options.pluginsOptions.bubble = $.extend(true, {

                bubbleData: [],
                godMode: false, //temporary
                pointRadius: 7,
                bubbleTemplate: $( template ),
                authorName: localStorage.getItem('authorName') || 'Anonymus',
                pathName: window.location.pathname,

                getDataInited: false,

                demoSections: $(".source_example"),

                NAMESPACE: 'bubbles',
                PAGE_CLASS: 'source_main',

                RES_MENU_LINK: 'Comments',
                RES_MENU_GOD_MODE_LINK: 'Comments God Mode',

                CLASS_BBL_HOOK: 'js-bbl',
                CLASS_BBL_CLOSE_HOOK: 'js-bbl_close',
                CLASS_BBL_CANCEL_HOOK: 'js-bbl_cancel',
                CLASS_BBL_SUBMIT_HOOK: 'js-bbl_submit',
                CLASS_BBL_POINT_HOOK: 'js-bbl_point',

                CLASS_BBL_SHOW: '__show',
                CLASS_BBL_POINT_ACTIVE: '__active',
                CLASS_BBL_AUTHOR: 'source-bbl_author',
                CLASS_BBL_TXT: 'source-bbl_tx',
                CLASS_BBL_INPUT: 'source-bbl_it',
                CLASS_BBL_FORM: 'source-bbl_form',
                CLASS_BBL_INFO: 'source-bbl_info',
                CLASS_BBL_NAME: 'source-bbl_name',

                CLASS_BBL_WRAPPER: 'source-bbl_w',

                ID_NEW_BBL: 'newBbl'

            }, this.options.pluginsOptions.bubble);

            var tmplt = this.options.pluginsOptions.bubble.bubbleTemplate,
                classBblHook = _this.options.pluginsOptions.bubble.CLASS_BBL_HOOK,
                classBblShow = _this.options.pluginsOptions.bubble.CLASS_BBL_SHOW,
                classBblPointActive = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_ACTIVE,
                classBblWrapper = _this.options.pluginsOptions.bubble.CLASS_BBL_WRAPPER,
                classBblCloseHook = _this.options.pluginsOptions.bubble.CLASS_BBL_CLOSE_HOOK,
                classBblCancelHook = _this.options.pluginsOptions.bubble.CLASS_BBL_CANCEL_HOOK,
                classBblSubmitHook = _this.options.pluginsOptions.bubble.CLASS_BBL_SUBMIT_HOOK,
                classBblPointHook = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_HOOK;

            tmplt
                .on("click", "." + classBblCloseHook, function(e){
                    e.preventDefault();

                    var godMode = _this.options.pluginsOptions.bubble.godMode;

                    // if we can, delete bbl
                    if ( godMode ) {
                        var id = $(this).closest("." + classBblHook).parent().attr("id");
                        _this.removeBubble(id);

                    } else {
                        // or just hide
                        var bblWrp = $(this).closest("." + classBblWrapper);

                        bblWrp.find('.' + classBblHook).removeClass( classBblShow );
                        bblWrp
                            .find('.' + classBblPointHook)
                            .removeClass( classBblPointActive )
                        ;
                    }

                    e.stopPropagation();
                })
                .on("click", "." + classBblCancelHook, function(e){
                    e.preventDefault();

                    var id = $(this).closest('.' + classBblHook).parent().attr('id');
                    _this.removeBubble(id);
                    e.stopPropagation();
                })

                .on("click", "." + classBblSubmitHook, function(){
                    _this.submitBubble();
                })

                // click on bubble point
                .on("click", '.' + classBblPointHook, function(e) {

                    var infoBbl = $(this).prev(),
                        infoBblHeight = infoBbl.height(),
                        offsetFromTop = infoBbl.parent().offset().top - $(window).scrollTop(),
                        heightHeader = 60;

                    // show or hide point
                    $(this).toggleClass( classBblPointActive );

                    infoBbl.toggleClass( classBblShow );

                    if ( infoBbl.hasClass( classBblShow ) && (infoBblHeight > offsetFromTop - heightHeader) ) {
                        $('body').animate({
                           scrollTop: ( $(window).scrollTop() - (infoBblHeight - offsetFromTop + 2 * heightHeader ) )
                        }, 500);
                    }

                    return false;
                 })

                .on("click", function(e){
                    e.stopPropagation();
                });

            $(function(){
                if ( _this.options.pluginsEnabled.bubble ) {
                    _this.init();
                }
            });

        }

        Bubble.prototype = module.createInstance();
        Bubble.prototype.constructor = Bubble;

        Bubble.prototype.init = function () {
            var getDataInited = this.options.pluginsOptions.bubble.getDataInited;

            if ( !getDataInited ) {
                this.getData();
            }

            this.addMenuItem();
        };

        /* Добавляет пункт меню */
        Bubble.prototype.addMenuItem = function(){
            var _this = this,
                resMenuLink = _this.options.pluginsOptions.bubble.RES_MENU_LINK,
                resMenuGodModeLink = _this.options.pluginsOptions.bubble.RES_MENU_GOD_MODE_LINK;

            innerNavigation.addMenuItem( resMenuLink,
                function() {
                    _this.bindEvents();

                    // for able to delete a bubble ( temporary )
                    innerNavigation.addMenuItem( resMenuGodModeLink,
                        function(){
                            _this.options.pluginsOptions.bubble.godMode = true;

                        },
                        function(){
                            _this.options.pluginsOptions.bubble.godMode = false;
                        }
                    );

                },
                function() {
                    _this.unbindEvents();
                }
            );
        };

        /* возвращает n-й по счету section, начиная с нуля */
        Bubble.prototype.getSectionByNum = function (num) {
            return this.options.pluginsOptions.bubble.demoSections[num];
        };

        /* возвращает порядковый номер section-а по элементу */
        Bubble.prototype.getSectionNum = function (sec) {
            return this.options.pluginsOptions.bubble.demoSections.index(sec);
        };

        /* рисует один бабл в заданом блоке, с заданными координатами и текстом */
        Bubble.prototype.drawSingleBubble = function (id, section, x, y, timestamp, text, name, firstTimeDrawning) {
            var _this = this,
                newBubble = _this.options.pluginsOptions.bubble.bubbleTemplate.clone(true),
                classBblShow = _this.options.pluginsOptions.bubble.CLASS_BBL_SHOW,
                classBblAuthor = _this.options.pluginsOptions.bubble.CLASS_BBL_AUTHOR,
                classBblTxt = _this.options.pluginsOptions.bubble.CLASS_BBL_TXT,
                classBblInput = _this.options.pluginsOptions.bubble.CLASS_BBL_INPUT,
                classBblForm = _this.options.pluginsOptions.bubble.CLASS_BBL_FORM,
                classBblInfo = _this.options.pluginsOptions.bubble.CLASS_BBL_INFO,
                classBblPointActive = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_ACTIVE,

                classBblHook = _this.options.pluginsOptions.bubble.CLASS_BBL_HOOK,
                classBblPointHook = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_HOOK;

            // bbl form wrapper
            newBubble.css({
                    left: x,
                    top: y
                })
                .attr("timestamp", timestamp)
                .attr("id", id)
                .appendTo(_this.getSectionByNum(section))
            ;

            if (name === "") {
                name = _this.options.pluginsOptions.bubble.authorName;
            }

            if ( !firstTimeDrawning ) {
                // bbl form
                newBubble.children('.' + classBblHook).addClass( classBblShow );

                //bbl point
                newBubble.children('.' + classBblPointHook ).addClass( classBblPointActive);
            }

            newBubble
                .find("." + classBblAuthor).text(name)
                .end().find("." + classBblTxt).text(text)
                .end().find("." + classBblInput).trigger("focus");

            if (text != "") {
                newBubble.find("." + classBblForm).hide();
                newBubble.find("." + classBblInfo).addClass( classBblShow );
            }
        };

        /* рисует один бабл в заданом блоке, с заданными координатами и текстом */
        Bubble.prototype.createBubble = function (id, section, x, y, timestamp, text, name, firstTimeDrawning) {
            var idNewBbbl = this.options.pluginsOptions.bubble.ID_NEW_BBL;

            // close already opened new bubble form
            this.removeBubble( idNewBbbl );

            // draw new bubble form
            this.drawSingleBubble(id, section, x, y, timestamp, text, name, firstTimeDrawning);
        };

        /* прячем бабл по id */
        Bubble.prototype.hideBubble = function (id) {
            var bbl = $("#" + id),
                classBblHook = this.options.pluginsOptions.bubble.CLASS_BBL_HOOK,
                classBblShow = this.options.pluginsOptions.bubble.CLASS_BBL_SHOW;

            bbl.find('.' + classBblHook).removeClass( classBblShow );
            setTimeout(function() {
                bbl.remove();
            }, 300);
        };

        /* сабмит бабла */
        Bubble.prototype.submitBubble = function () {
            var _this = this,

                idNewBbbl = _this.options.pluginsOptions.bubble.ID_NEW_BBL,
                classBblShow = _this.options.pluginsOptions.bubble.CLASS_BBL_SHOW,
                classBblAuthor = _this.options.pluginsOptions.bubble.CLASS_BBL_AUTHOR,
                classBblTxt = _this.options.pluginsOptions.bubble.CLASS_BBL_TXT,
                classBblInput = _this.options.pluginsOptions.bubble.CLASS_BBL_INPUT,
                classBblForm = _this.options.pluginsOptions.bubble.CLASS_BBL_FORM,
                classBblName = _this.options.pluginsOptions.bubble.CLASS_BBL_NAME,
                classBblInfo = _this.options.pluginsOptions.bubble.CLASS_BBL_INFO,

                classSourceExample = _this.options.exampleSectionClass,

                bubbleEl = $("#" + idNewBbbl ),
                timestamp = bubbleEl.attr("timestamp"),
                text = bubbleEl.find("." + classBblInput).val(),

                //temp
                name = bubbleEl.find("." + classBblName).val() ||
                        localStorage.getItem('authorName') ||
                        'Anonymus',

                x = bubbleEl.css("left"),
                y = bubbleEl.css("top"),

                section = this.getSectionNum(bubbleEl.closest("." + classSourceExample));

            bubbleEl.find("." + classBblForm).hide();
            bubbleEl.find("." + classBblTxt).text(text);
            bubbleEl.find("." + classBblAuthor).text(name);
            bubbleEl.find("." + classBblInfo).addClass( classBblShow );
            bubbleEl.addClass( classBblShow );

            if ( name ) localStorage.setItem('authorName', name);

            this.pushBubbleData({
                section: section,
                x: x,
                y: y,
                text: text,
                name: name,
                timestamp: timestamp
            });

            var bbl = {
                specURI: this.getPathToSpec(),
                section: section,
                x: x,
                y: y,
                text: text,
                name: name,
                timestamp: timestamp
            };

            this.setBubble(bbl, bubbleEl);
        };

        /* рисует все бабблы из массива бабблов */
        Bubble.prototype.drawBubblesArray = function (bubbles) {
            if(typeof bubbles === 'undefined') {
                bubbles = this.options.pluginsOptions.bubble.bubbleData;
            }

            for (var i = 0; i < bubbles.length; i++) {
                this.drawSingleBubble(bubbles[i]._id, bubbles[i].section, bubbles[i].x, bubbles[i].y, bubbles[i].timestamp, bubbles[i].text, bubbles[i].name, true);
            }
        };

        Bubble.prototype.getPathToSpec = function () {
            var uri = this.options.pluginsOptions.bubble.pathName.split("/");

            uri[uri.length - 1] = "";

            return uri.join("/");
        };

        Bubble.prototype.getData = function () {
            var _this = this;

            $.ajax({
                url: '/getBubbles',
                dataType: 'jsonp',
                jsonpCallback: 'callback',
                context: _this,
                data: {
                    pathToDataFile: _this.getPathToSpec()
                },
                success: function(data){
                    if(data != null) {
                        this.setBubbleData(data);
                        this.drawBubblesArray();
                    }
                },
                error: function(e, m){
                    //console.log(e, m);
                }
            });

            this.options.pluginsOptions.bubble.getDataInited = true;
        };

        Bubble.prototype.setBubble = function (data, bubbleEl) {
            var _this = this;

            $.extend(data, {pathToDataFile:_this.getPathToSpec()});

            $.ajax({
                url: '/setBubble',
                dataType: 'jsonp',
                jsonpCallback: 'callback',
                context: _this,

                data: data,

                success: function(data) {
                    bubbleEl.attr('id', data._id);
                }
            });

        };

        Bubble.prototype.removeBubble = function (id) {
            var _this = this,
                idNewBbbl = _this.options.pluginsOptions.bubble.ID_NEW_BBL;


            if(id === idNewBbbl) {
                this.hideBubble(id);
                return;
            }

            $.ajax({
                url: '/removeBubble',
                dataType: 'jsonp',
                jsonpCallback: 'callback',

                data: {id : id},

                success: function() {
                    _this.hideBubble(id);
                }
            });

        };

        Bubble.prototype.getBubbleData = function () {
            return this.options.pluginsOptions.bubble.bubbleData;
        };

        Bubble.prototype.setBubbleData = function (data) {
            this.options.pluginsOptions.bubble.bubbleData = data;
        };

        Bubble.prototype.pushBubbleData = function (bubble) {
            this.options.pluginsOptions.bubble.bubbleData.push(bubble);
        };

        Bubble.prototype.bindEvents = function () {
            var _this = this,
                exampleSectionClass = _this.options.exampleSectionClass,
                pointRadius = _this.options.pluginsOptions.bubble.pointRadius,
                idNewBbbl = _this.options.pluginsOptions.bubble.ID_NEW_BBL,
                mainPage =  $('.' + _this.options.mainClass),
                namespace = _this.options.pluginsOptions.bubble.NAMESPACE,
                classBblHook = _this.options.pluginsOptions.bubble.CLASS_BBL_HOOK,
                classBblShow = _this.options.pluginsOptions.bubble.CLASS_BBL_SHOW,
                classBblPointActive = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_ACTIVE,
                classBblPointHook = _this.options.pluginsOptions.bubble.CLASS_BBL_POINT_HOOK;

            //opened all bubbles and active points
            $('.' + classBblHook).addClass( classBblShow );
            $('.' + classBblPointHook).addClass( classBblPointActive );

            mainPage

                // click on section, adding new bbl
                .on("click." + namespace, '.' + exampleSectionClass, function(e){
                    e.preventDefault();

                    var offset = $(this).offset(),
                        relX = e.pageX - offset.left - pointRadius,
                        relY = e.pageY - offset.top - pointRadius,
                        sectionNum = _this.getSectionNum($(this)),
                        timestamp = new Date().getTime();

                    _this.createBubble( idNewBbbl, sectionNum, relX, relY, timestamp, "", "", false);

                })

                //use keys for manipulate bbl form
                .on("keyup." + namespace, function(e) {
                    e.preventDefault();

                    /* Close new bbl form on ESC */
                    if ( e.keyCode == 27 ) {
                        _this.removeBubble( idNewBbbl );
                    }

                    /* Submit new bbl form on Enter  */
                    if ( e.keyCode == 13 ) {
                        _this.submitBubble();
                    }
                })
        };

        Bubble.prototype.unbindEvents = function () {
            var _this = this,
                mainPage =  $('.' + _this.options.mainClass),
                namespace = _this.options.pluginsOptions.bubble.NAMESPACE;

            mainPage.off('.' + namespace);
        };

    return new Bubble();

});