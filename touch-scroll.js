/*! Copyright (c) 2012 Michael Bogdanov (m2bogdanov@gmail.com)
 * Licensed under the MIT License.
 *
 * Version: 1.0.0
 *
 * Tested with jquery v1.6.4
 *
 * Warning: This plugin patch a style of target element:
 *          overflow set to hidden,
 *          position set to relative (unless your target already has absolute position),
 *          If your layout require position another than absolute or relative it can crash :(
 */

(function($) {
    var TouchScroll = function(box) {
        this.outerBoxElement = $(box);
        this.patchOuterBox();
        this.innerBox = new TouchScroll.InnerBox(this.outerBoxElement);
        this.bindTouchEvents();
        //this.makePointer();
    };

    TouchScroll.prototype = {
        patchOuterBox: function() {
            this.outerBoxElement.css("overflow", "hidden");

            // It is bad patch. If your layout require position another than absolute or relative it can crash :(
            var currentOuterBoxPosition = this.outerBoxElement.css("position");
            if (currentOuterBoxPosition != "absolute") {
                this.outerBoxElement.css("position", "relative");
            }
        },

        bindTouchEvents: function() {
            this.outerBoxElement.bind("touchstart mousedown", $.proxy(this.touchStart, this));
            $(window).bind("touchmove mousemove", $.proxy(this.touchMove, this));
            $(window).bind("touchend mouseup", $.proxy(this.touchEnd, this));
        },

        makePointer: function() {
            this.pointer = $("<div>").appendTo(this.outerBox);
            this.pointer.addClass("pointer");
            this.pointer.css({
                width: "5px",
                height: "50px",
                position: "absolute",
                right: "2px",
                "background-color": "gray",
                top: "0px"
            });
        },

        touchStart: function(ev) {
            this.touchStartY = ev.clientY || ev.originalEvent.touches[0].clientY;
            ev.preventDefault();
        },

        touchMove: function(ev) {
            if (this.touchStartY) {
                var touchY = ev.clientY || ev.originalEvent.touches[0].clientY;
                console.log(touchY - this.touchStartY);
                this.innerBox.setOffset(touchY - this.touchStartY);
                ev.preventDefault();
            }
        },

        touchEnd: function(ev) {
            this.innerBox.saveOffset();
            this.touchStartY = null;
            ev.preventDefault();
        }
    };

    TouchScroll.InnerBox = function(outerBoxElement) {
        var outerBoxContent = $("*", outerBoxElement);
        this.outerBoxElement = outerBoxElement;
        this.element = $("<div>").appendTo(outerBoxElement);
        this.element.addClass("inner-box");
        outerBoxContent.appendTo(this.element);

        this.startPositionY = 0;
        this.currentPositionY = 0;

        this.element.css({
            position: "relative",
            top: this.currentPositionY,
            overflow: "hidden"
        });
    }

    TouchScroll.InnerBox.prototype = {
        setOffset: function(offsetY) {
            this.currentPositionY = this.startPositionY + offsetY;
            this.element.css("top", this.currentPositionY);
        },

        saveOffset: function() {
            var elementHeight = this.element.height();
            var outerBoxElementInnerHeight = this.outerBoxElement.innerHeight();

            if (elementHeight + this.currentPositionY < outerBoxElementInnerHeight) {
                this.startPositionY = Math.min(-elementHeight + outerBoxElementInnerHeight, 0);
                this.element.animate({top: this.startPositionY});
            } else if (this.currentPositionY > 0) {
                this.startPositionY = 0;
                this.element.animate({top: this.startPositionY});
            } else {
                this.startPositionY = this.currentPositionY;
            }
        }
    }

    $.fn.extend({
        touchScroll: function() {
            return new TouchScroll(this);
        }
    });
})(jQuery);