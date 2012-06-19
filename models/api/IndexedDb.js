define('profiler/models/api/indexedDb', function () {

	/**
	 * [ndexedDb constructor
	 * @param  {[type]} options      [description]
	 * @param  {[type]} onStoreReady [description]
	 * @return {[type]}              [description]
	 */
	var indexedDb = function(options, onStoreReady) {

		/** static helper methods **/
		this.normalizeConstants = function(object, constants) {
			for (var prop in constants) {
				if (!(prop in object)) {
					object[prop] = constants[prop];
				}
			}
		};
		this.emptyFunc = function(){};
		this.update = function(target, source) {
			var name, s, empty = {};
			for(name in source){
				s = source[name];
				if (s !== empty[name] && s !== target[name]){
					target[name] = s;
				}
			}
			return target;
		};
		this.execute = function (scope, method) {
			if (!method){ method = scope; scope = null; }
			if (typeof method === "string") {
				scope = scope || window;
				if (!scope[method]) { throw(['method not found']); }
				return function() {
					return scope[method].apply(scope, arguments || []);
				};
			}
			return !scope ? method : function() {
				return method.apply(scope, arguments || []);
			};
		};

		this.update(this, options);

		this.onStoreReady = onStoreReady;

		this.consts = window.IDBTransaction || window.webkitIDBTransaction;
		this.normalizeConstants(this.consts, {
			'READ_ONLY'		: 'readonly',
			'READ_WRITE'	: 'readwrite',
			'VERSION_CHANGE': 'versionchange'
		});

		this.cursor = window.IDBCursor || window.webkitIDBCursor;
		this.normalizeConstants(this.cursor, {
			'NEXT'				: 'next',
			'NEXT_NO_DUPLICATE'	: 'nextunique',
			'PREV'				: 'prev',
			'PREV_NO_DUPLICATE'	: 'prevunique'
		});

		this.openDB();
	};

	indexedDb.prototype = {
		consts: window.IDBTransaction || window.webkitIDBTransaction,
		cursor: window.IDBCursor || window.webkitIDBCursor,
		db: null,
		dbName: null,
		dbDescription: null,
		dbVersion: null,
		error : {
			'version'		: function(error){ console.error('Failed to set version.', error); },
			'deleteStore'	: function(error){ console.error('Failed to delete objectStore.', error); },
			'write'			: function(error) { console.error('Could not write data.', error); },
			'read'			: function(error) { console.error('Could not read data.', error); },
			'remove'		: function(error) { console.error('Could not remove data.', error); },
			'clear'			: function(error) { console.error('Could not clear store.', error); },
			'createIndex'	: function(error) { console.error('Could not create index.', error); },
			'removeIndex'	: function(error) { console.error('Could not remove index.', error); },
			'cursor'		: function(error) { console.error('Could not open cursor.', error); }
		},
		idb: window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB,
		store: null,
		storeName: null,
		keyPath: null,
		autoIncrement: null,
		features: null,
		onStoreReady: this.emptyFunc,
		openDB: function() {

	        var that = this, features = this.features = {}, openRequest;

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
				if (gotVersionErr){
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
							setTimeout(this.onStoreReady);
						})
					);
				} else {
					this.checkVersion(that.execute(this, function(){
						this.getObjectStore(that.execute(this, function(){
							setTimeout(this.onStoreReady);
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

			this.enterMutationState(this.execute(this, function(evt){
				var db = evt.target.result, success;
				db.deleteObjectStore(this.storeName);
				return !this.hasObjectStore() ? onError() : onSuccess();
			}), onError);
		},

		/* DATA MANIPULATION */
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

		get: function(key, onSuccess, onError) {

			var getTransaction, getRequest;

			onError = onError ? onError : this.error.read;
			onSuccess = onSuccess ? onSuccess : this.emptyFunc;

			getTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
			getRequest = getTransaction.objectStore(this.storeName).get(key);
			getRequest.onsuccess = function(event){ onSuccess(event.target.result); };
			getRequest.onerror = onError;
		},

		remove: function(key, onSuccess, onError) {

			var removeTransaction, deleteRequest;

			onError = onError ? onError : this.error.remove;
			onSuccess = onSuccess ? onSuccess : this.emptyFunc;

			removeTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
			deleteRequest = removeTransaction.objectStore(this.storeName)['delete'](key);
			deleteRequest.onsuccess = function(event){ onSuccess(event.target.result); };
			deleteRequest.onerror = onError;
		},

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

		clear: function(onSuccess, onError) {

			var clearTransaction, clearRequest;

			onError = onError ? onError : this.error.clear;
			onSuccess = onSuccess ? onSuccess : this.emptyFunc;

			clearTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
			clearRequest = clearTransaction.objectStore(this.storeName).clear();
			clearRequest.onsuccess = function(event){ onSuccess(event.target.result); };
			clearRequest.onerror = onError;
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
			this.enterMutationState(this.execute(this, function(evt) {

				var result = evt.target.result, index;

				if (result.objectStore){ // transaction
					index = db.objectStore(this.storeName).createIndex(indexName, propertyName, { unique: !!isUnique });
				} else { // db
					var putTransaction = result.transaction([that.storeName] /* , this.consts.READ_WRITE */ );
					var store = putTransaction.objectStore(that.storeName);
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
			this.enterMutationState(this.execute(this, function(evt){
				evt.target.result.objectStore(this.storeName).deleteIndex(indexName);
				onSuccess();
			}), onError);
		},

		/* DB CURSOR */
		iterate: function(callback, options) {

			var directionType, cursorTransaction, cursorTarget, cursorRequest;

			options = this.update({
				'index'			: null,
				'order'			: 'ASC',
				'filterDupes'	: false,
				'keyRange'		: null,
				'writeAccess'	: false,
				'onEnd'			: null,
				'onError'		: this.error.cursor
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
	};
});

var db = new indexedDb({
	'dbName'		: 'IDB',
	'storeName'		: 'Store',
	'dbVersion'		: 1,
	'keyPath'		: 'id',
	'autoIncrement'	: true
}, db.put({'test' : 'dataObj'}, db.iterate(info)));

