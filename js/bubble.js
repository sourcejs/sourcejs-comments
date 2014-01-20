/**
 * Created by Alexey Ostrovsky, Gennady Tsarinny
 * Date: 20.01.14
 * Time: 17:02
 */
"use strict";

define([
    "core/options",
    "modules/innerNavigation",
    "modules/css"], function (options, innerNavigation, /* cookie,*/ css) {

        var moduleCss = new css("bubble/bubble.css"),
            authorName = localStorage.getItem('authorName') || 'Anonymus',
            bblPointRadius = 7,
            bblGodMode = false;

        function Bubble() {

            var _this = this;

            this.pathName = window.location.pathname;
            this.bubbleData = [];
            this.isOn = false;

            // элементы на странице
            this.demoSections = $(".source_example");
            this.demoSectionsClass = ".source_example";
            this.switchButtonClass = ".source_main_nav_ac-toggle-comments";
            this.page = $(".source_main");
            this.resMenuLink = 'Comments';

            /* вкл/выкл комментирования */
            innerNavigation.addMenuItem(this.resMenuLink, function() {
                _this.bindEvents();

                // for able to delete a bubble
                innerNavigation.addMenuItem("Comments God Mode",
                    function(){
                        bblGodMode = true;
                    },
                    function(){
                        bblGodMode = false;
                    }
                );

            }, function() {
                _this.unbindEvents();
            });

            // шаблон баббла
            // TODO: переделать на templates
            this.bubbleTemplate = $("" +
                "<div class='js-bbl_w'>" +
                "<div class='js-bbl'>" +
                "<div class='js-bbl_form'>" +
                "<textarea class='js-bbl_it' placeholder='Ваш комментарий'></textarea>" +
                "<div class='js-bbl_sep'></div>" +
                "<input class='js-bbl_name_it' placeholder='Подпишитесь, чтобы вас узнали'/>" +
                "<div class='js-bbl_actions'>" +
                "<button class='js-bbl_submit'>Save</button>" +
                "<a href='#' class='js-bbl_cancel'>Cancel</a>" +
                "</div>" +
                "</div>" +
                "<div class='js-bbl_info'>" +
                "<div class='js-bbl_tx'></div>" +
                "<div class='js-bbl_name'></div>" +
                "<div class='js-bbl_close'></div>" +
                "</div>" +
                "</div>" +
                "<div class='js-bbl-point'></div>" +
                "</div>"
            );

            this.bubbleTemplate.on("click", ".js-bbl_close", function(e){
                e.preventDefault();

                // if we can, delete bbl
                if ( bblGodMode ) {
                    var id = $(this).closest(".js-bbl").parent().attr("id");
                    _this.removeBubble(id);

                } else {
                    // or just hide
                    var bblWrp = $(this).closest(".js-bbl_w");

                    bblWrp.find('.js-bbl').removeClass('js-bbl__on');
                    bblWrp
                        .find('.js-bbl-point')
                        .removeClass('__active')
                    ;
                }

                e.stopPropagation();
            });

            // delete new bbl
            this.bubbleTemplate.on("click", ".js-bbl_cancel", function(e){
                e.preventDefault();

                var id = $(this).closest(".js-bbl").parent().attr("id");
                _this.removeBubble(id);
                e.stopPropagation();
            });


            this.bubbleTemplate.on("click", ".js-bbl_submit", function(){
                _this.submitBubble();
            });

            // click on bubble point
            this.bubbleTemplate.on("click", '.js-bbl-point', function(e) {

                var infoBbl = $(this).prev(),
                    infoBblHeight = infoBbl.height(),
                    offsetFromTop = infoBbl.parent().offset().top - $(window).scrollTop(),
                    heightHeader = 60;

                // show or hide bbl
                $(this).toggleClass('__active');

                infoBbl.toggleClass('js-bbl__on');

                if ( infoBbl.hasClass('js-bbl__on') && (infoBblHeight > offsetFromTop - heightHeader) ) {
                    $('body').animate({
                        scrollTop: ( $(window).scrollTop() - (infoBblHeight - offsetFromTop + 2 * heightHeader ) )
                    }, 500);
                }

                return false;
            });

            this.bubbleTemplate.click(function(e){
                e.stopPropagation();
            });

        }

        /* возвращает n-й по счету section, начиная с нуля */
        Bubble.prototype.getSectionByNum = function (num) {
            return this.demoSections[num];
        };

        /* возвращает порядковый номер section-а по элементу */
        Bubble.prototype.getSectionNum = function (sec) {
            return this.demoSections.index(sec);
        };

        /* рисует один бабл в заданом блоке, с заданными координатами и текстом */
        Bubble.prototype.drawSingleBubble = function (id, section, x, y, timestamp, text, name, firstTimeDrawning) {
            var _this = this,
                newBubble = this.bubbleTemplate.clone(true);

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
                name = authorName;
            }

            if ( !firstTimeDrawning ) {
                // bbl form
                newBubble.children('.js-bbl').addClass("js-bbl__on");

                //bbl point
                newBubble.children('.js-bbl-point').addClass('__active');
            }

            newBubble
                .find(".js-bbl_name").text(name)
                .end().find(".js-bbl_tx").text(text)
                .end().find(".js-bbl_it").trigger("focus");

            if (text != "") {
                newBubble.find(".js-bbl_form").hide();
                newBubble.find(".js-bbl_info").addClass("js-bbl__show");
            }
        };

        /* рисует один бабл в заданом блоке, с заданными координатами и текстом */
        Bubble.prototype.createBubble = function (id, section, x, y, timestamp, text, name, firstTimeDrawning) {
            // close already opened new bubble form
            this.removeBubble("newBbl");

            // draw new bubble form
            this.drawSingleBubble(id, section, x, y, timestamp, text, name, firstTimeDrawning);
        };

        /* прячем бабл по id */
        Bubble.prototype.hideBubble = function (id) {
            var bbl = $("#" + id);

            bbl.find('.js-bbl').removeClass("js-bbl__on");
            setTimeout(function() {
                bbl.remove();
            }, 300);
        };

        /* сабмит бабла */
        Bubble.prototype.submitBubble = function () {
            var bubbleEl = $("#newBbl"),
                timestamp = bubbleEl.attr("timestamp"),
                text = bubbleEl.find(".js-bbl_it").val(),

            //temp
                name = bubbleEl.find(".js-bbl_name_it").val() ||
                    localStorage.getItem('authorName') ||
                    'Anonymus',

                x = bubbleEl.css("left"),
                y = bubbleEl.css("top");

            var section = this.getSectionNum(bubbleEl.closest(".source_example"));

            bubbleEl.find(".js-bbl_form").hide();
            bubbleEl.find(".js-bbl_tx").text(text);
            bubbleEl.find(".js-bbl_name").text(name);
            bubbleEl.find(".js-bbl_info").addClass("js-bbl__show");
            bubbleEl.addClass("js-bbl__on");

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
                bubbles = this.bubbleData;
            }

            for (var i = 0; i < bubbles.length; i++) {
                this.drawSingleBubble(bubbles[i]._id, bubbles[i].section, bubbles[i].x, bubbles[i].y, bubbles[i].timestamp, bubbles[i].text, bubbles[i].name, true);
            }
        };

        Bubble.prototype.getPathToSpec = function () {
            var uri = this.pathName.split("/");
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
        };

        Bubble.prototype.setBubble = function (data, bubbleEl) {
            var _this = this,
                id;

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

            if(id === "newBbl") {
                this.hideBubble(id);
                return;
            }

            var _this = this;

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
            return this.bubbleData;
        };

        Bubble.prototype.setBubbleData = function (data) {
            this.bubbleData = data;
        };

        Bubble.prototype.pushBubbleData = function (bubble) {
            this.bubbleData.push(bubble);
        };

        Bubble.prototype.bindEvents = function () {
            var _this = this;

            //opened all bubbles and active points
            $('.js-bbl').addClass('js-bbl__on');
            $('.js-bbl-point').addClass('__active');

            this.page

                // click on section, add new bbl
                .on("click.bubbles", _this.demoSectionsClass, function(e){
                    e.preventDefault();

                    var offset = $(this).offset(),
                        relX = e.pageX - offset.left - bblPointRadius,
                        relY = e.pageY - offset.top - bblPointRadius,
                        num = _this.getSectionNum($(this)),
                        timestamp = new Date().getTime();

                    _this.createBubble('newBbl', num, relX, relY, timestamp, "", "", false);

                })

                //use keys for manipulate bbl form
                .on("keyup.bubbles", function(e) {
                    e.preventDefault();

                    /* Close new bbl form on ESC */
                    if ( e.keyCode == 27 ) {
                        _this.removeBubble("newBbl");
                    }

                    /* Submit new bbl form on Enter  */
                    if ( e.keyCode == 13 ) {
                        _this.submitBubble();
                    }
                })
        };

        Bubble.prototype.unbindEvents = function () {
            this.page.off(".bubbles");
        };

        /* init bubble.js */
        if(options.pluginsEnabled.bubble) {
            var bubble = new Bubble();
            bubble.getData();

        }
    }
);