;(function ( root, factory ) {
    if ( typeof exports === 'object' ) {
        // CommonJS
        exports = factory();
    } else if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( ['notify'], factory);
    } else {
        // Browser globals
        root.notify = factory();
    }
})(this, function() {

    var container;

    var _options = {
        position: 'right top',
        resetTimeout: true,
        closeButton: true,
        delay: 3000,
        onClosed: function() {},
        onBeforeClose: function() {},
        onClick: function() {}
    };


    /**
    * create main container
    */
    if ( !(container = document.getElementById('notify')) ) {
        container = document.createElement('div');
        container.id = 'notify';
    }

    var conteinersByPosition = {};

    function invokeCallback(opts, type, args) {
        var cb = opts[type];

        if (cb && 'function' == typeof cb) {
            return cb();
        }
    }

    function createPosition(opts) {
        var posBlock = document.createElement('ul');
        posBlock.className = [].concat.apply(['notify-container'], opts.position).join(' ');

        if (!container.parentNode) {
            document.body.appendChild(container);
        }

        container.appendChild(posBlock);
        conteinersByPosition[opts.positionType] = posBlock;
    }

    function normalizePosition(position) {
        if ('string' == typeof position) {
            position = position.split(' ');
        }

        var possiblePositions = [
            ['left', 'right'],
            ['top',  'bottom']
        ];

        position.sort(function(a, b) {
            return possiblePositions[0].indexOf(a) == -1;
        });

        return [
            ~possiblePositions[0].indexOf(position[0]) ? position[0] : 'right',
            ~possiblePositions[1].indexOf(position[1]) ? position[1] : 'top'
        ]
    }

    function createMessage(opts) {
        if ( !(opts.positionType in conteinersByPosition) ) {
            createPosition(opts);
        }

        var ul = conteinersByPosition[opts.positionType];
        var li = document.createElement('li');
        var content = '';

        /**
        * markup - message doesn't visible yet
        */
        li.className = opts.level + ' markup';

        content = '<div class="notify-title"></div><div class="notify-message"></div>';

        if (opts.closeButton) {
            content = '<button type="button" class="notify-close">&#10006;</button>' + content;
        }

        li.innerHTML = content;
        ul.appendChild(li);

        return li;
    }

    function animate(options) {
        var start = Date.now();

        if (!options.timing) {
            options.timing = function(bounce) {
                return bounce;
            }
        }

        requestAnimationFrame(function animate() {
            var timeFraction = (Date.now() - start) / options.duration;
            if (timeFraction > 1) timeFraction = 1;

            // current state of animation
            var progress = options.timing(timeFraction)

            options.draw(progress);

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                options.done && options.done();
            }
        });
    }

    /**
    * @param {String} level of message
    * @param {arguments} options of message
    */
    function Notify(level, options) {
        options = [].slice.apply(options);

        if (!options || !options[0]) {
            throw new Error('Add a message');
        }

        this.text = options[0];
        this.options = Object.create(_options);
        this.options.level = level;
        this.title = '';

        var opts = options[2];

        if ('string' == typeof options[1]) {
            this.title = options[1];
        } else {
            opts = options[1];
        }

        if ('object' == typeof opts) {
            for(var i in opts) {
                this.options[i] = opts[i];
            }
        }

        this.options.position = normalizePosition(this.options.position);
        this.options.positionType = this.options.position.join('');
        this.notifyBlock = createMessage(this.options);

        this._initCycle();

        this._update();
    }

    Notify.prototype._initCycle = function() {
        var opts = this.options;
        var closeContainer = opts.closeButton
            ? this.notifyBlock.querySelector('button')
            : this.notifyBlock;
        var ctrl = this;

        if (closeContainer) {
            closeContainer.addEventListener('click', function(e) {
                e.preventDefault();
                ctrl.hide();
            });
        }

        if (opts.resetTimeout) {
            this.notifyBlock.addEventListener('mouseleave', function() {
                ctrl.initHideInterval();
            }, false);

            this.notifyBlock.addEventListener('mouseenter', function() {
                clearTimeout(ctrl.__interval);
            }, false);
        }

        this.initHideInterval();
    };

    Notify.prototype.initHideInterval = function() {
        clearTimeout(this.__interval);
        this.__interval = setTimeout(this.hide.bind(this), this.options.delay);
    }

    Notify.prototype._update = function() {
        /**
        * gm...
        */
        this.notifyBlock.querySelector('.notify-message').innerHTML = this.text;

        var nt = this.notifyBlock.querySelector('.notify-title');

        nt.innerHTML = this.title;
        nt.style.display = 'string' == typeof this.title && this.title ? '' : 'none';
    };

    Notify.prototype.message = function(message) {
        if (message) {
            this.text = message;
            this._update();
        } else {
            return this.text;
        }
    };

    Notify.prototype.hide = function() {
        try {
            var notifyBlock = this.notifyBlock;
            var opts = this.options;

            if (false === invokeCallback(opts, 'onBeforeClose')) {
                return;
            }

            animate({
                duration: 500,
                draw: function(percent) {
                    notifyBlock.style.opacity = 1 - percent;
                },
                done: function() {
                    notifyBlock.parentNode && notifyBlock.parentNode.removeChild(notifyBlock);

                    invokeCallback(opts, 'onClosed');
                }
            });
        } catch(e) {}
    }

    return {
        warn: function(/*text,*/ /*title,*/ /*options*/) {
            return new Notify('warn', arguments);
        },

        success: function() {
            return new Notify('success', arguments);
        },

        error: function() {
            return new Notify('error', arguments);
        },

        info: function() {
            return new Notify('info', arguments);
        }

        /* this level by defailt */
        /* alert: function() {} */
    }

});
