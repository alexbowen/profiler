/**
 * utilities
 * thanks to Rob Taylor http://www.goodbytes.co.uk for the logging shit
 */
define('lib/framework/utils', function () {


    /* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     */
    // Inspired by base2 and Prototype
    (function(){
        var initializing = false,
            fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

        // The base Class implementation (does nothing)
        this.Class = function(){};

        // Create a new Class that inherits from this class
        Class.extend = function(prop) {
            var _super = this.prototype;

            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;

            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) : prop[name];
            }

            // The dummy class constructor
            function Class() {
                // All construction is actually done in the init method
                if (!initializing && this.init) {
                    this.init.apply(this, arguments);
                }
            }

            // Populate our constructed prototype object
            Class.prototype = prototype;

            // Enforce the constructor to be what we expect
            Class.prototype.constructor = Class;

            // And make this class extendable
            Class.extend = arguments.callee;

            return Class;
        };
    })();

    var utils = {
        /**
         * Provides a simple way to code to an interface(s).
         * Will compare Class and Interface to check for property
         * and type and hence warn you if Class does not implement Interface.
         * @type {function}
         * @param {object} Class
         * @example utils.implement(objectToTest, inteface1, interface2...);
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
                            return false;
                        }
                    }
                }
            }
            return true;
        },

        /**
         * Handles if messages should be shown, and if a native console is available. If a native console is not available
         * a popup console is created.
         * @private
         * @param {string} method - a string which represents what kind of log message is being sent (eg: log, info, warn)
         * @param {array} argumentArray - an array of arguments being sent to be logged (the array items can be any type)
         */
        _logMessage: function (method, argumentArray) {

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