/**
 * utilities
 * thanks to Rob Taylor www.goodbytes.co.uk for the logging shit
 */
define('utils', function () {

    var utils = {
        /**
         * Provides a simple way to code to an interface(s).
         * Will compare Class and Interface to check for property
         * and type and hence warn you if Class does not implement Interface.
         * @type {function}
         * @param {object} Class
         * @example utils.lang.implement(objectToTest, inteface1, interface2...);
         */
        implement : function (Class) {
            var Interface,
                member,
                i = 1;

            for (; i < arguments.length; i++) {
                Interface = arguments[i];

                for (member in Interface) {
                    if (Interface.hasOwnProperty(member)) {
                        if (typeof Class[member] !== typeof Interface[member]) {
                            return /*Class.Class.fullName + */" Class supplied failed to implement interface property " + member;
                        }
                    }
                }
            }
            return false;
        },

        /**
         * Handles if messages should be shown, and if a native console is available. If a native console is not available
         * a popup console is created.
         * @private
         * @param {string} method - a string which represents what kind of log message is being sent (eg: log, info, warn)
         * @param {array} argumentArray - an array of arguments being sent to be logged (the array items can be any type)
         */
        _logMessage: function (method, argumentArray) {
            // Switching off all logging when debugging is disabled.
            if (!this._options.enableDebug) {
                return;
            }

            // Update event logging on each log iteration - should ensure we cover any freshly bound events
            this._eventLogging();

            // Checking if console is availible
            // Also checking if the popup should be used in preference
            if (!!window.console && !!window.console[method]) {

                // Checking for standards compliant console function.
                if (typeof window.console[method] === 'function') {
                    window.console[method].apply(window.console, argumentArray);
                } else { // Checking for IE console (rare)
                    window.console[method](Array.prototype.join.call(argumentArray, ' '));
                }
            }

            if (this._options.tabletLogging) {
                var l = $('#tabletLogging'), c, p;

                switch (method) {
                case 'info':
                    c = '#00f';
                    break;
                case 'warn':
                    c = '#ff0';
                    break;
                case 'error':
                    c = '#f00';
                    break;
                case 'log':
                    c = '#0f0';
                    break;
                default:
                    c = '#666';
                }
                p = $('<p style="padding: 5px"><span style="color: ' + c + '; font-weight: 700;">' + method + '</span> - ' + Array.prototype.join.call(argumentArray, ', ') + '</p>');
                if (l.length < 1) {
                    l = $('<div id="tabletLogging" style="background: #fff;"></div>');
                    $('body').append(l);
                }
                l.append(p);
            }
        }
    };

    /**
     * Attaching "logging._logMessage('log', arguments)" to the log on the global namespace
     * @name log
     * @global
     * @type {function}
     * @example log('string', {object: {}}, 1); // RESULTS in console log message: "string", {object: {}}, 1
     */
    window.log = window.log || function () {
        utils._logMessage('log', arguments);
    };

    /**
     * Attaching "logging._logMessage('info', arguments)" to the info on the global namespace
     * @name info
     * @global
     * @type {function}
     * @example info('string', {object: {}}, 1); // RESULTS in console info message: "string", {object: {}}, 1
     */
    window.info = window.info || function () {
        utils._logMessage('info', arguments);
    };

    /**
     * Attaching "logging._logMessage('warn', arguments)" to the warn on the global namespace
     * @name warn
     * @global
     * @type {function}
     * @example warn('string', {object: {}}, 1); // RESULTS in console warning message: "string", {object: {}}, 1
     */
    window.warn = window.warn || function () {
        utils._logMessage('warn', arguments);
    };

    /**
     * Attaching "logging._logMessage('error', arguments)" to the error on the global namespace
     * @name error
     * @global
     * @type {function}
     * @example error('string', {object: {}}, 1); // RESULTS in console error message: "string", {object: {}}, 1
     */
    window.error = window.error || function () {
        utils._logMessage('error', arguments);
    };

    return utils;
});