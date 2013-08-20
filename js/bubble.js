/**
 * Created by Alexey Ostrovsky.
 * Date: 15.01.13
 * Time: 17:02
 */
"use strict";

define([
    "core/options",
    "modules/innerNavigation",
    "plugins/bubble/lib/jquery.cookie",
    "modules/css"
    ], function (options, innerNavigation, cookie, css) {

        var moduleCss = new css("bubble/bubble.css");

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
            }, function() {
                _this.unbindEvents();
            });

            // шаблон баббла
            // TODO: переделать на templates
            this.bubbleTemplate = $("" +
                    "<div class='js-bbl'>" +
                    "<div class='js-bbl_form'>" +
                    "<textarea class='js-bbl_it' placeholder='Ваш комментарий'></textarea>" +
                    "<div class='js-bbl_sep'></div>" +
                    "<input class='js-bbl_name_it' placeholder='Подпишитесь, чтобы вас узнали'/>" +
                    "<div class='js-bbl_actions'>" +
                    "<button class='js-bbl_submit'>Сохранить</button>" +
                    "<a href='#' class='js-bbl_cancel'>Отмена</a>" +
                    "</div>" +
                    "</div>" +
                    "<div class='js-bbl_info'>" +
                    "<div class='js-bbl_tx'></div>" +
                    "<div class='js-bbl_name'></div>" +
                    "<div class='js-bbl_close'></div>" +
                    "</div>" +
                    "</div>"
            );

            this.bubbleTemplate.click(function(e){
                e.stopPropagation();
            });

            this.bubbleTemplate.find(".js-bbl_close, .js-bbl_cancel").click(function(e){
                e.preventDefault();

                //var timestamp = $(this).closest(".js-bbl").attr("timestamp");
                var id = $(this).closest(".js-bbl").attr("id");

                _this.removeBubble(id);
                e.stopPropagation();
            });

            /* TODO: вычистить это говнецо */
            this.bubbleTemplate.find(".js-bbl_submit").click(function(){
                var bbl = $(this).closest(".js-bbl");
                var timestamp = bbl.attr("timestamp");
                var text = bbl.find(".js-bbl_it").val();
                var name = bbl.find(".js-bbl_name_it").val();
                var sec = _this.getSectionNum($(this).closest(".source_example"));
                var x = bbl.css("left");
                var y = bbl.css("top");

                bbl.find(".js-bbl_form").hide();
                bbl.find(".js-bbl_tx").text(text);
                bbl.find(".js-bbl_name").text(name);
                bbl.find(".js-bbl_info").addClass("js-bbl__show");
                bbl.addClass("js-bbl__on");

                _this.submitBubble(bbl, sec, x, y, text, name,  timestamp);
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
        Bubble.prototype.drawSingleBubble = function (id, section, x, y, timestamp, text, name) {
            var _this = this;

            var newBubble = this.bubbleTemplate.clone(true);

            newBubble.css({
                left:x,
                top:y
            })
                    .attr("timestamp", timestamp)
                    .attr("id", id)
                    .appendTo(_this.getSectionByNum(section));


            if (name === "") {
                name = $.cookie("commentAuthor");
                newBubble.find(".js-bbl_name_it").val(name);
            }

            newBubble.find(".js-bbl_name").text(name);
            newBubble.find(".js-bbl_tx").text(text);

            newBubble.find(".js-bbl_it").trigger("focus");
            newBubble.addClass("js-bbl__on");

            if (text != "") {
                newBubble.find(".js-bbl_form").hide();
                newBubble.find(".js-bbl_info").addClass("js-bbl__show");
            }
        };

        /* рисует один бабл в заданом блоке, с заданными координатами и текстом */
        Bubble.prototype.createBubble = function (id, section, x, y, timestamp, text, name) {
            this.drawSingleBubble(id, section, x, y, timestamp, text, name);
        };

        /* прячем бабл по id */
        Bubble.prototype.hideBubble = function (id) {
            var bbl = $("#" + id);
            bbl.removeClass("js-bbl__on");
            setTimeout(function() {
                bbl.remove();
            }, 400);
        };

        /* сабмит бабла */
        Bubble.prototype.submitBubble = function (bubbleEl, section, x, y, text, name, timestamp) {
            $.cookie("commentAuthor", name);

            this.pushBubbleData({section: section, x: x, y: y, text: text, name: name, timestamp: timestamp});

            var bbl = {specURI: this.getPathToSpec(),section: section, x: x, y: y, text: text, name: name, timestamp: timestamp};

            this.setBubble(bbl, bubbleEl);

            this.setData();
        };

        /* рисует все бабблы из массива бабблов */
        Bubble.prototype.drawBubblesArray = function (bubbles) {
            if(typeof bubbles === 'undefined') {
                bubbles = this.bubbleData;
            }

            for (var i = 0; i < bubbles.length; i++) {
                this.drawSingleBubble(bubbles[i]._id, bubbles[i].section, bubbles[i].x, bubbles[i].y, bubbles[i].timestamp, bubbles[i].text, bubbles[i].name);
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

        Bubble.prototype.setData = function (data) {
/*
            var _this = this;

            if(typeof data === 'undefined') {
                data = this.getBubbleData();
            }

            var sendData = {
                pathToDataFile:_this.getPathToSpec(),
                bubbleData: data
            };

            $.ajax({
                url: options.pluginsDir + "bubble/setBubbles.php",
                context: document.body,
                type: "GET",

                data: {sendData: JSON.stringify(sendData)},

                success: function(data) {
                    console.log(data._id);
                }
            });
*/
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
            var _this = this;

            $.ajax({
                url: '/removeBubble',
                dataType: 'jsonp',
                jsonpCallback: 'callback',
                context: _this,

                data: {id : id},

                success: function() {
                    this.hideBubble(id);
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

            this.page.on("click", _this.demoSectionsClass, function(e){
                e.preventDefault();

                var offset = $(this).offset();

                var relX = e.pageX - offset.left;
                var relY = e.pageY - offset.top;

                var num = _this.getSectionNum($(this));
                var timestamp = new Date().getTime();

                _this.createBubble('newBbl', num, relX, relY, timestamp, "", "");
            });
        };

        Bubble.prototype.unbindEvents = function () {
            var _this = this;

            this.page.off("click", _this.demoSectionsClass);
        };

        /* init bubble.js */
        if(options.pluginsEnabled.bubble) {
            var bubble = new Bubble();
            bubble.getData();
        }
    }
);