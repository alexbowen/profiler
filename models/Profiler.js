define('profiler/models/api/Chart', function () {

    /**
     * @exports profiler/models/api/Chart
     * @requires jquery-1
     */
    var Chart = {

        /**
         * init
         * @return {void}
         */
        init: function () {
            YAHOO.widget.Chart.SWFURL = "http://yui.yahooapis.com/2.9.0/build/charts/assets/charts.swf";
        },

        /**
         * registerFunction
         * @param  {string} name
         * @param  {[type]}
         * @return {void}
         */
        registerFunction: function (name, scope) {
            YAHOO.tool.Profiler.registerFunction(name, scope);
        },

        /**
         * getFunctionReport
         * @param  {string} name
         * @return {object}
         */
        getFunctionReport: function (name) {
            return YAHOO.tool.Profiler.getFunctionReport(name);
        },

        /**
         * unregisterFunction
         * @param  {string} name
         * @return {void}
         */
        unregisterFunction: function (name) {
            YAHOO.tool.Profiler.unregisterFunction(name);
        },

        /**
         * plot
         * @param  {object} data
         * @param  {string} type
         * @return {void}
         */
        plot: function (data, type) {

            var myDataSource, myChart;
            YAHOO.example.profile = data;

            myDataSource = new YAHOO.util.DataSource(YAHOO.example.profile);

            myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
            myDataSource.responseSchema = {
                fields: [ "id", "name", "avg", "calls", "max", "min" ]
            };

            myChart = new YAHOO.widget.LineChart("profile-view", myDataSource, {
                xField: "id",
                yField: type
            });
        }
    };

    return Chart;
});