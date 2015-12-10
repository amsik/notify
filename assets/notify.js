
var notify = (function(win) {

    var container;
    var _options = {
        position: 'right top',
        overlay: false,
        resetTimeout: false,
        closeButton: true,
        delay: 3000,
        onClose: function() {},
        onClick: function() {},
        beforeStart: function() {},
        afterEnd: function() {}
    };


    /**
    * create main container
    */
    if ( !(container = document.getElementById('notify')) ) {
        container = document.createElement('div');
        container.id = 'notify';

        document.body.appendChild(container);
    }

    var conteinersByPosition = {};

    function createPosition(opts) {
        var posBlock = document.createElement('ul');
        posBlock.classList.add.apply(
            posBlock.classList,
            [].concat.apply(['notify-container'], opts.position)
        );

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
        li.classList.add(opts.level, 'markup');

        content = '<div class="notify-title"></div><div class="notify-message"></div>';

        if (opts.closeButton) {
            content = '<button type="button" name="button">×</button>' + content;
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

        // second args can be options (without descr)
        if (options.length >= 2) {
            this.title = options[1];

            if (options[2] && 'object' == typeof options[2]) {
                for(var i in options[2]) {
                    this.options[i] = options[2][i];
                }
            }

        }

        this.options.position = normalizePosition(this.options.position);
        this.options.positionType = this.options.position.join('');
        this.notifyBlock = createMessage(this.options);

        this._initCycle();

        this._update();
    }

    Notify.prototype._initCycle = function() {
        var closeContainer = this.options.closeButton
            ? this.notifyBlock.querySelector('button')
            : this.notifyBlock;
        var ctrl = this;

        if (closeContainer) {
            closeContainer.addEventListener('click', function(e) {
                e.preventDefault();
                ctrl.hide();
            });
        }

        this.__interval = setTimeout(ctrl.hide.bind(ctrl), this.options.delay);
    };

    Notify.prototype._update = function() {
        /**
        * gm...
        */
        this.notifyBlock.querySelector('.notify-message').innerHTML = this.text;
        this.notifyBlock.querySelector('.notify-title').innerHTML = this.title || '';
    };

    Notify.prototype.message = function(message) {
        if (message) {
            this.text = message;
            this._update();
        } else {
            return this.text;
        }
    };

    Notify.prototype.title = function(title) {
        if (title) {
            this.title = title;
            this._update();
        } else {
            return this.title;
        }
    };

    Notify.prototype.hide = function() {
        try {
            var notifyBlock = this.notifyBlock;

            animate({
                duration: 500,
                draw: function(percent) {
                    notifyBlock.style.opacity = 1 - percent;
                },
                done: function() {
                    notifyBlock.parentNode && notifyBlock.parentNode.removeChild(notifyBlock);
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
    }
})(window);
