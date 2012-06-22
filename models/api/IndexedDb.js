/**
 * @return module:profiler/models/api/indexedDb
 */
 define('models/api/indexedDb', [
    'models/Database',
    'lib/framework/utils'
], function (Database) {

    /**
     * indexedDb
     * constructor
     * @param  {object} options
     * @param  {function} onStoreReady callback for db ready
     * @return {void}
     */
    var indexedDbModel = Database.extend({

        init: function () {
            /**
             * normalizeConstants
             * merges the properties of two objects
             * @param  {object} object
             * @param  {object} constants
             * @return {void}
             */
            var normalizeConstants = function(object, constants) {
                for (var prop in constants) {
                    if (!(prop in object)) {
                        object[prop] = constants[prop];
                    }
                }
            };

            this.consts = window.IDBTransaction || window.webkitIDBTransaction;
            normalizeConstants(this.consts, {
                'READ_ONLY'        : 'readonly',
                'READ_WRITE'    : 'readwrite',
                'VERSION_CHANGE': 'versionchange'
            });

            this.cursor = window.IDBCursor || window.webkitIDBCursor;
            normalizeConstants(this.cursor, {
                'NEXT'                : 'next',
                'NEXT_NO_DUPLICATE'    : 'nextunique',
                'PREV'                : 'prev',
                'PREV_NO_DUPLICATE'    : 'prevunique'
            });
        },

        consts: window.IDBTransaction || window.webkitIDBTransaction,
        cursor: window.IDBCursor || window.webkitIDBCursor,
        db: null,
        dbName: null,
        dbDescription: null,
        dbVersion: null,
        emptyFunc : function(){},
        error : {
            'version'       : function(error) { console.error('Failed to set version.', error); },
            'deleteStore'   : function(error) { console.error('Failed to delete objectStore.', error); },
            'write'         : function(error) { console.error('Could not write data.', error); },
            'read'          : function(error) { console.error('Could not read data.', error); },
            'remove'        : function(error) { console.error('Could not remove data.', error); },
            'clear'         : function(error) { console.error('Could not clear store.', error); },
            'createIndex'   : function(error) { console.error('Could not create index.', error); },
            'removeIndex'   : function(error) { console.error('Could not remove index.', error); },
            'cursor'        : function(error) { console.error('Could not open cursor.', error); }
        },
        idb: window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB,
        store: null,
        storeName: null,
        keyPath: null,
        autoIncrement: null,
        features: null,
        onStoreReady: this.emptyFunc,

        /** helper methods **/

        /**
         * update
         * copys properties from one object to another
         * but not overwriting if it already exists.
         * @param  {object} target
         * @param  {object} source
         * @return {void}
         */
        update : function(target, source) {
                        this._super();
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
         * execute
         * execute a function in scope of the specified object.
         * @param  {object} scope
         * @param  {function} func
         * @return {object}
         */
        execute : function (scope, func) {
            if (!func){ func = scope; scope = null; }
            if (typeof func === "string") {
                scope = scope || window;
                if (!scope[func]) { throw(['method not found']); }
                return function() {
                    return scope[func].apply(scope, arguments || []);
                };
            }
            return !scope ? func : function() {
                return func.apply(scope, arguments || []);
            };
        },
        openDB: function(options, onStoreReady) {

            var that = this, features = this.features = {}, openRequest;

            this.update(this, options);

            // need to check for FF10, which implements the new setVersion API
            this.newVersionAPI = !!(window.IDBFactory && IDBFactory.prototype.deleteDatabase);

            features.hasAutoIncrement = !window.mozIndexedDB; // TODO: Still, really?

            if (this.newVersionAPI) {
                this.dbVersion = parseInt(this.dbVersion, 10);
                openRequest = this.idb.open(this.dbName, this.dbVersion, this.dbDescription);
            } else {
                openRequest = this.idb.open(this.dbNamee, this.dbDescription);
            }

            openRequest.onerror = this.execute(this, function(error){
                var gotVersionErr = false;
                if ('error' in error.target) {
                    gotVersionErr = error.target.error.name === "VersionError";
                } else if ('errorCode' in error.target) {
                    gotVersionErr = error.target.errorCode === 12;
                }
                if (gotVersionErr) {
                    this.dbVersion++;
                    setTimeout(that.execute(that, 'openDB'));
                } else {
                    console.error('Could not open database, error', error);
                }
            });

            openRequest.onsuccess = that.execute(that, function(event){

                this.db = event.target.result;
                this.db.onversionchange = function(event){
                    event.target.close();
                };
                if (this.newVersionAPI){
                    this.getObjectStore(that.execute(this, function(){
                            setTimeout(onStoreReady);
                        })
                    );
                } else {
                    this.checkVersion(that.execute(this, function(){
                        this.getObjectStore(that.execute(this, function(){
                            setTimeout(onStoreReady);
                        }));
                    }));
                }
            });
        },

        enterMutationState: function(onSuccess, onError){
            if (this.newVersionAPI){
                this.dbVersion++;
                var openRequest = this.idb.open(this.dbName, this.dbVersion, this.dbDescription);
                openRequest.onupgradeneeded = onSuccess;
                openRequest.onsuccess = onError;
                openRequest.onerror = onError;
                openRequest.onblocked = onError;
            } else {
                this.setVersion(onSuccess, onError);
            }
        },

        /* VERSIONING */
        checkVersion: function(onSuccess, onError){
            if (this.getVersion() !== this.dbVersion){
                this.setVersion(onSuccess, onError);
            } else {
                return onSuccess && onSuccess();
            }
        },

        getVersion: function(){
            return parseInt(this.db.version, 10);
        },

        setVersion: function(onSuccess, onError){
            onError = onError ? onError : this.error.version;
            var versionRequest = this.db.setVersion(parseInt(this.dbVersion, 10));
            versionRequest.onerror = onError;
            versionRequest.onblocked = onError;
            versionRequest.onsuccess = onSuccess;
        },

        /* OBJECT STORE HANDLING */
        getObjectStore: function(onSuccess, onError){
            if (this.hasObjectStore()){
                this.openExistingObjectStore(onSuccess, onError);
            } else {
                this.createNewObjectStore(onSuccess, onError);
            }
        },

        hasObjectStore: function(){
            return this.db.objectStoreNames.contains(this.storeName);
        },

        createNewObjectStore: function(onSuccess, onError) {
            this.enterMutationState(this.execute(this, function(){
                this.store = this.db.createObjectStore(this.storeName, { keyPath: this.keyPath, autoIncrement: this.autoIncrement});
                log('sdf', this.store);
                onSuccess(this.store);
            }), onError);
        },

        openExistingObjectStore: function(onSuccess, onError) {
            var emptyTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
            this.store = emptyTransaction.objectStore(this.storeName);
            emptyTransaction.abort();
            onSuccess(this.store);
        },

        deleteObjectStore: function(onSuccess, onError) {

            onError = onError ? onError : this.error.version;

            this.enterMutationState(this.execute(this, function(event){
                var db = event.target.result, success;
                db.deleteObjectStore(this.storeName);
                return !this.hasObjectStore() ? onError() : onSuccess();
            }), onError);
        },

        _getAllCursor: function(tr, onSuccess, onError) {

            var all = [],
                store = tr.objectStore(this.storeName),
                cursorRequest = store.openCursor();

            cursorRequest.onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    all.push(cursor.value);
                    cursor['continue']();
                } else {
                    onSuccess(all);
                }
            };
            cursorRequest.onError = onError;
        },

        _getUID: function(){
            return +new Date();
        },

        /* INDEXING */
        createIndex: function(indexName, propertyName, isUnique, onSuccess, onError) {

            var that = this;

            onSuccess = onSuccess ? onSuccess : this.emptyFunc;
            onError = onError ? onError : this.error.createIndex;

            propertyName = propertyName ? propertyName : indexName;
            this.enterMutationState(this.execute(this, function(event) {

                var result = event.target.result, index;

                if (result.objectStore){ // transaction
                    index = db.objectStore(this.storeName).createIndex(indexName, propertyName, { unique: !!isUnique });
                } else { // db
                    var putTransaction = result.transaction([that.storeName] /* , this.consts.READ_WRITE */ ),
                        store = putTransaction.objectStore(that.storeName);
                        index = store.createIndex(indexName, propertyName, { unique: !!isUnique });
                }
                onSuccess(index);
            }), onError);
        },

        getIndex: function(indexName) {
            return this.store.index(indexName);
        },

        getIndexList: function() {
            return this.store.indexNames;
        },

        hasIndex: function(indexName) {
            return this.store.indexNames.contains(indexName);
        },

        removeIndex: function(indexName, onSuccess, onError) {

            onSuccess = onSuccess ? onSuccess : this.emptyFunc;
            onError = onError ? onError : this.error.removeIndex;

            this.enterMutationState(this.execute(this, function(event){
                event.target.result.objectStore(this.storeName).deleteIndex(indexName);
                onSuccess();
            }), onError);
        },

        /* DATA MANIPULATION - PUBLIC API */

        /**
         * put
         * @param  {[type]} dataObj
         * @param  {function} onSuccess
         * @param  {function} onError
         * @return {void}
         */
        put: function(dataObj, onSuccess, onError) {

            var putTransaction, putRequest;

            onError = onError ? onError : this.error.write;
            onSuccess = onSuccess ? onSuccess : this.emptyFunc;

            if (typeof dataObj[this.keyPath] === 'undefined' && !this.features.hasAutoIncrement){
                dataObj[this.keyPath] = this._getUID();
            }

            putTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
            putRequest = putTransaction.objectStore(this.storeName).put(dataObj);
            putRequest.onsuccess = function(event){ onSuccess(event.target.result); };
            putRequest.onerror = onError;
        },

        /**
         * get
         * @param  {[type]} key
         * @param  {function} onSuccess
         * @param  {function} onError
         * @return {void}
         */
        get: function(key, onSuccess, onError) {

            var getTransaction, getRequest;

            onError = onError ? onError : this.error.read;
            onSuccess = onSuccess ? onSuccess : this.emptyFunc;

            getTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
            getRequest = getTransaction.objectStore(this.storeName).get(key);
            getRequest.onsuccess = function(event){ onSuccess(event.target.result); };
            getRequest.onerror = onError;
        },

        /**
         * remove
         * @param  {[type]} key unique identifier
         * @param  {function} onSuccess
         * @param  {function} onError
         * @return {void}
         */
        remove: function(key, onSuccess, onError) {

            var removeTransaction, deleteRequest;

            onError = onError ? onError : this.error.remove;
            onSuccess = onSuccess ? onSuccess : this.emptyFunc;

            removeTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
            deleteRequest = removeTransaction.objectStore(this.storeName)['delete'](key);
            deleteRequest.onsuccess = function(event){ onSuccess(event.target.result); };
            deleteRequest.onerror = onError;
        },

        /**
         * getAll
         * @param  {function} onSuccess
         * @param  {function} onError
         * @return {void}
         */
        getAll: function(onSuccess, onError) {

            var getAllTransaction, store;

            onError = onError ? onError : this.error.read;
            onSuccess = onSuccess ? onSuccess : this.emptyFunc;

            getAllTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);

            store = getAllTransaction.objectStore(this.storeName);

            if (store.getAll){
                var getAllRequest = store.getAll();
                getAllRequest.onsuccess = function(event){ onSuccess(event.target.result); };
                getAllRequest.onerror = onError;
            } else {
                this._getAllCursor(getAllTransaction, onSuccess, onError);
            }
        },

        /**
         * clear
         * @param  {function} onSuccess
         * @param  {function} onError
         * @return {void}
         */
        clear: function(onSuccess, onError) {

            var clearTransaction, clearRequest;

            onError = onError ? onError : this.error.clear;
            onSuccess = onSuccess ? onSuccess : this.emptyFunc;

            clearTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
            clearRequest = clearTransaction.objectStore(this.storeName).clear();
            clearRequest.onsuccess = function(event){ onSuccess(event.target.result); };
            clearRequest.onerror = onError;
        },

        iterate: function(callback, options) {

            var directionType, cursorTransaction, cursorTarget, cursorRequest;

            callback = callback ? callback : this.emptyFunc;

            options = this.update({
                'index'         : null,
                'order'         : 'ASC',
                'filterDupes'   : false,
                'keyRange'      : null,
                'writeAccess'   : false,
                'onEnd'         : null,
                'onError'       : this.error.cursor
            }, options || {});

            directionType = options.order.toLowerCase() === 'desc' ? 'PREV' : 'NEXT';

            if (options.filterDupes){
                directionType += '_NO_DUPLICATE';
            }

            cursorTransaction = this.db.transaction([this.storeName], this.consts[options.writeAccess ? 'READ_WRITE' : 'READ_ONLY']);
            cursorTarget = cursorTransaction.objectStore(this.storeName);

            if (options.index){
                cursorTarget = cursorTarget.index(options.index);
            }

            cursorRequest = cursorTarget.openCursor(options.keyRange, this.cursor[directionType]);
            cursorRequest.onerror = options.onError;
            cursorRequest.onsuccess = function(event){
                var cursor = event.target.result;
                if (cursor){
                    callback(cursor.value, cursor, cursorTransaction);
                    cursor['continue']();
                } else {
                    return options.onEnd && options.onEnd() || callback(null, cursor, cursorTransaction);
                }
            };
        }
    });

    var indexedDb = indexedDbModel;

    indexedDb.instance = null;

    //Ensures we always use the same instance of the object
    indexedDb.getInstance = function () {
        if (indexedDb.instance === null) {
            indexedDb.instance = new indexedDbModel();
        }

        return indexedDb.instance;
    };

    var database = indexedDb.getInstance();

    /* PUBLIC API ACCESSOR METHODS - EVERY THING ELSE IN HERE IS INVISIBLE */
    return {
        'openDB'    : function(options, onReady) { database.openDB(options, onReady); },
        'put'       : function (data, onSuccess, onError) { database.put(data, onSuccess, onError); },
        'get'       : function (key, onSuccess, onError) { database.get(key, onSuccess, onError); },
        'remove'    : function (key, onSuccess, onError) { database.remove(key, onSuccess, onError); },
        'getAll'    : function (onSuccess, onError) { database.getAll(onSuccess, onError); },
        'clear'     : function (onSuccess, onError) { database.clear(onSuccess, onError); },
        'iterate'   : function (callback, options) { database.iterate(callback, options); }
    };
});