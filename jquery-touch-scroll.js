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

(function ($) {
    var TouchScroll = function (box, params) {
        this.params = $.extend({
            wheelStep:20,
            pointer:true,
            animateAcceleration:1,
            animateTimeStep:10
        }, params);

        this.outerBoxElement = $(box);
        this.patchOuterBox();
        this.innerBox = new TouchScroll.InnerBox(this.outerBoxElement);
        this.bindEvents();
        if (this.params.pointer) {
            this.pointer = new TouchScroll.Pointer(this.outerBoxElement, this.innerBox);
            this.innerBox.pointer = this.pointer;
        }
    };

    TouchScroll.prototype = {
        patchOuterBox:function () {
            this.outerBoxElement.css("overflow-y", "hidden");

            // It is bad patch. If your layout require position another than absolute or relative it can crash :(
            var currentOuterBoxPosition = this.outerBoxElement.css("position");
            if (currentOuterBoxPosition != "absolute") {
                this.outerBoxElement.css("position", "relative");
            }
        },

        bindEvents:function () {
            this.outerBoxElement.bind("touchstart mousedown", $.proxy(this.touchStart, this));
            $("body").bind("touchmove mousemove", $.proxy(this.touchMove, this));
            $("body").bind("touchend mouseup", $.proxy(this.touchEnd, this));
            $(this.outerBoxElement).bind("mousewheel", $.proxy(this.mousewheel, this));
        },

        touchStart:function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.touchStartY = ev.clientY || ev.originalEvent.touches[0].clientY;
        },

        touchMove:function (ev) {
            if (this.touchStartY) {
                ev.preventDefault();
                ev.stopPropagation();
                var touchY = ev.clientY || ev.originalEvent.touches[0].clientY;
                this.innerBox.setOffset(touchY - this.touchStartY);
                this.innerBox.showCover();

                this.lastPoint = this.currentPoint || this.touchStartY;
                this.currentPoint = touchY;
                this.speed = this.currentPoint - this.lastPoint;
            }
        },

        touchEnd:function (ev) {
            if (this.touchStartY) {
                ev.preventDefault();
                ev.stopPropagation();
                this.innerBox.saveOffset();
//                this.animate(this.speed);
                this.touchStartY = null;
                this.innerBox.hideCover();
            }
        },

        mousewheel:function (ev, delta, deltaX, deltaY) {
            ev.preventDefault();
            ev.stopPropagation();
            this.innerBox.setOffset(this.params.wheelStep * delta);
            this.innerBox.saveOffset();
        },

        animate:function (speed) {
            var acceleration = this.params.animateAcceleration;
            var timeStep = this.params.animateTimeStep;
            var sign = speed / Math.abs(speed);

            var newPosition = this.innerBox.getPosition() + speed;
            if (newPosition < this.innerBox.getMaxPosition() && newPosition > this.innerBox.getMinPosition()) {
                this.innerBox.setPosition(newPosition);

                speed -= sign * acceleration;
                if (Math.abs(speed) > acceleration) {
                    setTimeout($.proxy(function () {
                        this.animate(speed)
                    }, this), timeStep);
                } else {
                    this.innerBox.saveOffset();
                }
            } else {
                this.innerBox.saveOffset();
            }
        }
    };

    TouchScroll.InnerBox = function (outerBoxElement) {
        var outerBoxContent = outerBoxElement.children();
        this.outerBoxElement = outerBoxElement;
        this.element = $("<div>").appendTo(outerBoxElement);
        this.element.addClass("inner-box");
        outerBoxContent.appendTo(this.element);

        this.cover = $("<div>").css({
            position:"absolute",
            top:0,
            left:0,
            right:0,
            bottom:0,
            display:"none"
        }).appendTo(this.element);

        this.startPositionY = 0;
        this.currentPositionY = 0;

        this.element.css({
            position:"relative",
            top:this.currentPositionY,
            "overflow-y":"hidden"
        });
    };

    TouchScroll.InnerBox.prototype = {
        showCover:function () {
            this.cover.show();
        },

        hideCover:function () {
            this.cover.hide();
        },

        getMinPosition:function () {
            return this.outerBoxElement.innerHeight() - this.element.height();
        },

        getMaxPosition:function () {
            return 0;
        },

        getPosition:function () {
            return this.currentPositionY;
        },

        setPosition:function (position, setPointer) {
            setPointer = setPointer == undefined ? true : scroll //Default true

            this.currentPositionY = position;
            this.element.css("top", this.currentPositionY);

            if (this.pointer && setPointer) {
                var minPosition = this.getMinPosition();
                var maxPosition = this.getMaxPosition();
                var pointerPosition = 1 - (this.currentPositionY - minPosition) / (maxPosition - minPosition);
                this.pointer.setPosition(pointerPosition, false);
            }
        },

        setOffset:function (offsetY, setPointer) {
            this.setPosition(this.startPositionY + offsetY, setPointer);
        },

        saveOffset:function (setPointer) {
            setPointer = setPointer == undefined ? true : scroll //Default true

            var minPosition = this.getMinPosition();
            var maxPosition = this.getMaxPosition();

            this.element.stop();
            if (this.currentPositionY < minPosition) {
                this.currentPositionY = this.startPositionY = Math.min(minPosition, 0);
                this.element.animate({top:this.startPositionY});
            } else if (this.currentPositionY > maxPosition) {
                this.currentPositionY = this.startPositionY = maxPosition;
                this.element.animate({top:this.startPositionY});
            } else {
                this.startPositionY = this.currentPositionY;
            }

            if (this.pointer && setPointer) {
                this.pointer.savePosition(false);
            }
        }
    };

    TouchScroll.Pointer = function (outerBoxElement, innerBox) {
        this.innerBox = innerBox;
        this.outerBoxElement = outerBoxElement;
        this.element = $("<div>").
            appendTo(outerBoxElement).
            addClass("pointer").
            css({
                width:"5px",
                height:"50px",
                position:"absolute",
                right:"2px",
                "background-color":"gray",
                top:"0px"
            });
        this.element.bind("touchstart mousedown", $.proxy(this.touchStart, this));
        $("body").bind("touchmove mousemove", $.proxy(this.touchMove, this));
        $("body").bind("touchend mouseup", $.proxy(this.touchEnd, this));
        this.setPosition(0);
        this.savePosition();
    };

    TouchScroll.Pointer.prototype = {
        getTrackLength:function () {
            return this.outerBoxElement.innerHeight() - this.element.height();
        },

        touchStart:function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.touchStartY = ev.clientY || ev.originalEvent.touches[0].clientY;
        },

        touchMove:function (ev) {
            if (this.touchStartY) {
                ev.preventDefault();
                ev.stopPropagation();
                var touchY = ev.clientY || ev.originalEvent.touches[0].clientY;

                // Set pointer position
                var newPosition = this.startPosition + (touchY - this.touchStartY) / this.getTrackLength();
                this.setPosition(newPosition);
            }
        },

        touchEnd:function (ev) {
            if (this.touchStartY) {
                ev.preventDefault();
                ev.stopPropagation();
                this.savePosition(this.currentPosition);
                this.innerBox.saveOffset();
                this.touchStartY = null;
            }
        },

        setPosition:function (newPosition, scroll) {
            scroll = scroll == undefined ? true : scroll //Default true

            this.currentPosition = newPosition;
            this.currentPosition = Math.max(this.currentPosition, 0);
            this.currentPosition = Math.min(this.currentPosition, 1);

            var top = this.getTrackLength() * this.currentPosition;
            this.element.css({top:top});

            if (scroll) {
                // Set innerBox position
                var innerBoxMin = this.innerBox.getMinPosition();
                var innerBoxMax = this.innerBox.getMaxPosition();
                var innerBoxPosition = innerBoxMin + (innerBoxMax - innerBoxMin) * (1 - this.currentPosition);
                this.innerBox.setPosition(innerBoxPosition, false);
            }
        },

        savePosition:function (scroll) {
            scroll = scroll == undefined ? true : scroll //Default true

            this.startPosition = this.currentPosition;
            if (scroll) {
                this.innerBox.saveOffset(false)
            }
        }
    };

    $.fn.extend({
        touchScroll:function (params) {
            $(this.each(function (i, el) {
                new TouchScroll(el, params);
            }))
            return this;
        }
    });
})
    (jQuery);