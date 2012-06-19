define('profiler/controllers/component/profiling', [
    'jquery-1',
    'js-signals',
    'profiler/controllers/base',
    'profiler/views/component/profiling',
    'profiler/models/api/Database',
    'profiler/models/Profiler',
    'profiler/models/api/Chart'
], function ($, Base, View, Database, Profiler, Chart) {

    /**
     * @exports profiler/controllers/component/profiling
     * @requires jquery-1
     * @requires js-signals
     * @requires profiler/controllers/base
     * @requires profiler/views/component/profiling
     * @requires profiler/models/api/Database
     * @requires profiler/models/Profiler
     * @requires profiler/models/api/Chart
     */
    var Profiling = {

        /**
         * init
         * @return {void}
         **/
        init: function () {

            var that = this;

            //in case a profiling invocation has been left in by mistake
            if (!window.profiler.config.profiling) {
                this.destroy();
                return;
            }

            this.parseProfiles();

            this.view = View;
            this.view.init(this.options.profiles);

            this.profiler = new Profiler();

            if (utils.clientSideDB) {
                this.chart = new Chart();

                this.initialiseDatabase();

                //have to delegate this event as element is outside container
                this.delegate(document.documentElement, '#profile-switch', 'click', function (ev) {
                    that.view.toggle();
                    that.update();
                });
            }

            this.registerProfiles();

            this.initialiseEvents();
        },

        /**
         * initialiseEvents
         * @return {void}
         **/
        initialiseEvents: function () {

            var that = this;

            //manually bind to avoid event namespacing
            $(document).bind('profiling:end', function () {

                var resultArray = [], fr, p;

                for (p in that.options.profiles) {
                    if (that.options.profiles.hasOwnProperty(p)) {

                        try {
                            fr = that.profiler.getFunctionReport(p);
                            resultArray.push([p, fr]);

                            if (utils.clientSideDB) {
                                that.storeProfile(p, fr);
                            }

                            that.profiler.unregisterFunction(p);
                        } catch (e) {
                            warn('no function report for ', p);
                        }
                    }
                }

                //jQuery workaround
                fr = that.profiler.getFunctionReport('$');
                resultArray.push(['$', fr]);

                if (utils.clientSideDB) {
                    that.storeProfile('$', fr);
                }

                window.console = window.console || {};
                window.console.table = window.console.table || function () {};

                that.profiler.unregisterFunction('$');

                console.table(resultArray);
            });
        },

        /**
         * parseProfiles
         * @return {void}
         **/
        parseProfiles: function () {

            var cp, methods = {}, method, profile;

            //loop through each profile
            for (profile in this.options.profiles) {

                //and extract the prototype methods
                cp = this.options.profiles[profile].Class.prototype;

                for (method in cp) {
                    if (cp.hasOwnProperty(method) && typeof cp[method] === 'function') {
                        methods[method] = {
                            'fn'    : method,
                            'scope' : this.options.profiles[profile]
                        };
                    }
                }
            }

            this.options.profiles = methods;
        },

        /**
         * registerProfiles
         * @return {void}
         **/
        registerProfiles: function () {

            var p;

            for (p in this.options.profiles) {
                if (this.options.profiles.hasOwnProperty(p)) {
                    try {
                        this.profiler.registerFunction(this.options.profiles[p].fn, this.options.profiles[p].scope);
                        this.profiler.registerFunction('$', window);
                    } catch(e) {
                        warn('cannot register function ', this.options.profiles[p], ' with profiler');
                    }
                }
            }
        },

        /**
         * storeProfile
         * @param  {string} name
         * @param  {string} profile
         * @return {void}
         */
        storeProfile: function (name, profile) {
            this.db.setTable(this.options.name).insert(
                ['name', 'avg', 'calls', 'max', 'min'],
                [name, profile.avg, profile.calls, profile.max, profile.min]
            );
        },

        /**
         * initialiseDatabase
         * @return {void}
         **/
        initialiseDatabase: function() {
            this.db = new Database({
                'name'  : 'profiling',
                'size'  : 2 //MB
            });

            this.db.createTable({
                name    : this.options.name,
                fields  : [
                    'id INTEGER PRIMARY KEY',
                    'name VARCHAR(100)',
                    'avg MEDIUMINT(6)',
                    'calls MEDIUMINT(6)',
                    'max MEDIUMINT(6)',
                    'min MEDIUMINT(6)'
                ]
            });
        },

        /**
         * update
         * @return {void}
         **/
        update: function () {

            var that = this, plot, method, row, i, result;

            if (this.view.isVisible()) {

                plot = function (tx, r) {
                    result = [];

                    for(i=0; i < r.rows.length; i++) {

                        row = r.rows.item(i);

                        result[i] = {
                            'id'    : row.id,
                            'name'  : row.name,
                            'avg'   : row.avg,
                            'calls' : row.calls,
                            'max'   : row.max,
                            'min'   : row.min
                        };
                    }

                    that.chart.plot(result, $('#profile-select select').attr('value'));
                };

                method = $('#method-select select').attr('value');

                this.db.setTable(this.options.name).select(false, {name : method}, plot);
            }
        },

        '#update click': function (el, args) {
            this.update();
        },

        '#clear click': function (el, args) {
            this.db.drop();
            this.update();
        }
    };

    return Base.extend('profiler.controllers.component.profiling', Profiling);

});

