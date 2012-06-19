define('profiler/models/Profiler', function () {

    /**
     * @exports profiler/models/Profiler
     * @requires jquery-1
     */
    var Profiler = {

        /**
         * @param  {string} name
         * @param  {[type]}
         * @return {void}
         */
        registerFunction: function (name, scope) {
            YAHOO.tool.Profiler.registerFunction(name, scope);
        },

        /**
         * @param  {string} name
         * @return {object}
         */
        getFunctionReport: function (name) {
            return YAHOO.tool.Profiler.getFunctionReport(name);
        },

        /**
         * @param  {string} name
         * @return {void}
         */
        unregisterFunction: function (name) {
            YAHOO.tool.Profiler.unregisterFunction(name);
        }
    };

    return Profiler;
});