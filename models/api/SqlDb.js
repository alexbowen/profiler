define('models/api/sqlDb', [
    'models/Database'
], function (Database) {

    sqlDbModel = Database.extend({

        init: function () {
            this.db = null;
            this.created = false;
            this.schemaRegistry = [];
        },

        /**
         * update
         * copys properties from one object to another
         * but not overwriting if it already exists.
         * @param  {object} target
         * @param  {object} source
         * @return {void}
         */
        update : function(target, source) {
            var name, s, empty = {};
            for(name in source){
                s = source[name];
                if (s !== empty[name] && s !== target[name]){
                    target[name] = s;
                }
            }
            return target;
        },

        /**
         * openDB
         * @param  {object} options
         * @param  {function} onReady callback
         * @return {void}
         */
        openDB : function (options, onReady) {

            this.update(options, options);

            this.db = openDatabase(
                options.name,
                '1.0',
                options.name,
                options.size * 1024 * 1024,
                onReady
            );
        },

        /**
         * setTable
         * @param {name} table
         * @return {object} this, to chain function
         */
        setTable: function (table) {
            this.currentTable = table;
            this.updateSchemaRegistry();
            return this;
        },

        /**
         * updateSchemaRegistry
         * @return {void}
         */
        updateSchemaRegistry: function () {

            var sql, that = this, callback;

            if (!this.schemaRegistry[this.currentTable]) {
                this.schemaRegistry[this.currentTable] = [];

                sql = "SELECT * FROM " + this.currentTable + " LIMIT 1";

                callback = function (tx, r) {

                    var i = 0, field;

                    for (; i < r.rows.length; i++) {
                        if (r !== null) {
                            for (field in r.rows.item(i)) {
                                if (field !== null) {
                                    that.schemaRegistry[that.currentTable].push(field);
                                }
                            }
                        }
                    }
                };

                this.query(sql, callback);
            }
        },

        /**
        * will pass true/false to the callback supplied if table exists
        * @param table to look for
        * @param callback function to be executed
        * @return {void}
        */
        tableExists: function (name, callback) {
            var sql, exists = false;

            sql = "SELECT name FROM SQLite_Master WHERE name = '" + name + "'";

            this.query(sql, function (tx, r) {
                var i = 0, field;

                for (; i < r.rows.length; i++) {
                    for (field in r.rows.item(i)) {
                        if (field !== null) {
                            exists = true;
                        }
                    }
                }

                callback(exists);
            });
        },

        /**
        * will pass true/false to the callback supplied if record exists
        * @param fields to select
        * @param condition to be met
        * @param callback function to be executed
        * @return {void}
        */
        recordExists: function (fields, where, callback) {

            var exists = false;

            this.select(fields, where, function (tx, r) {
                if (r.rows.length > 0) {
                    exists = true;
                }

                callback(exists);
            });
        },

        /**
         * createTable
         * @param  {object} schemaObj
         * @return {void}
         */
        createTable: function (schemaObj) {

            var schema = schemaObj.fields.join(", "), sql;

            sql = 'CREATE TABLE IF NOT EXISTS ' + schemaObj.name + ' (' + schema + ')';

            this.query(sql);
        },

        /**
        * wrapper for sql INSERT
        * @param fields array to select
        * @param where array
        * @return {void}
        */
        put: function (fields, values) {
            values = this.escapeString(values);
            fields = fields.join("', '");
            values = values.join("', '");

            var sql = "INSERT INTO " + this.currentTable + "('" + fields + "') VALUES ('" + values + "')";

            this.query(sql);
        },

        /**
        * wrapper for sql SELECT
        * @param fields array to select
        * @param where array
        * @param callback function to be executed
        * @return {void}
        */
        get: function (fields, where, callback) {

            var whereString = '', select, that = this, sql;

            whereString = this.parseWhereArray(where);
            select = !fields ? '*' : fields.join(', ');
            sql = "SELECT " + select + " FROM " + this.currentTable + whereString;

            this.query(sql, callback);
        },

        getAll : function (onSuccess, onError) {},
        deleteDatabase : function () {},

        /**
        * wrapper for sql DELETE
        * @param where array
        * @param callback function to be executed
        * @return {void}
        */
        remove: function (key, onSuccess, onError) {

            var sql, whereString;

            whereString = this.parseWhereArray(key);
            sql = "DELETE FROM " + this.currentTable + whereString;

            this.query(sql, onSuccess);
        },

        /**
        * wrapper for offline storage query method
        * @param sql string - sql to be executed
        * @param callback function to be executed
        * @return {void}
        */
        query: function (sql, callback) {
            this.db.transaction(function (tx) {
                tx.executeSql(sql, [], callback, function (tx, error) {
                    log('error', error.code, error.message, sql);
                });
            });
        },

        /**
        * will parse an array oy key values into the format:
        * WHERE title = 'eastenders' and episodeCount = 3
        * @param where array
        * @return {string}
        */
        parseWhereArray: function (where) {

            var whereArray = [], whereString = '', value, x;

            if (where) {
                for (x in where) {
                    if (where.hasOwnProperty(x)) {
                        value = typeof where[x] === 'string' ? "'" + where[x] + "'" : where[x];
                        whereArray.push(x + " = " + value);
                    }
                }

                whereString = " WHERE " + whereArray.join(' AND ');
            }

            return whereString;
        },

        /**
        * this will escape a value or array of values
        * eg "bbc's" will escape to "bbc''s"
        * @param value
        * @return string or array of strings
        */
        escapeString: function (value) {

            if (value.constructor === Array) {
                for (var x in value) {
                    if (value.hasOwnProperty(x)) {
                        if (typeof value[x] === 'number') {
                            value[x] = value[x].toString();
                        }
                        value[x] = value[x].replace("'", "''");
                    }
                }
            } else {

                if (typeof value === 'number') {
                    value = value.toString();
                }

                value = value.replace("'", "''");
            }

            return value;
        },

        /**
         * drop
         * @return {void}
         */
        clear: function (onSuccess, onError) {
            this.query("DELETE FROM function;", function () {
                log('table function deleted');
            });
        }
    });

    var sqlDb = sqlDbModel;

    sqlDb.instance = null;

    //Ensures we always use the same instance of the object
    sqlDb.getInstance = function () {
        if (sqlDb.instance === null) {
            sqlDb.instance = new sqlDbModel();
        }

        return sqlDb.instance;
    };

    var database = sqlDb.getInstance();

    /* PUBLIC API ACCESSOR METHODS - EVERY THING ELSE IN HERE IS INVISIBLE */
    return {
        'openDB'    : function(options, onReady) { database.openDB(options, onReady); },
        'put'       : function (data, onSuccess, onError) { database.put(data, onSuccess, onError); },
        'get'       : function (key, onSuccess, onError) { database.get(key, onSuccess, onError); },
        'remove'    : function (key, onSuccess, onError) { database.remove(key, onSuccess, onError); },
        'getAll'    : function (onSuccess, onError) { database.getAll(onSuccess, onError); },
        'clear'     : function (onSuccess, onError) { database.clear(onSuccess, onError); }
    };
});