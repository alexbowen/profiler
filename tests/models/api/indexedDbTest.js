define('tests/profiler/models/indexedDbTest', [
    'jquery-1',
    'profiler/models/indexedDb'
], function ($, indexedDb) {

    module('Profiler.Models.IndexedDb');

    var database = new indexedDb({
		'dbName'		: 'qunitDb',
		'storeName'		: 'TestStore',
		'dbVersion'		: 1,
		'keyPath'		: 'id',
		'autoIncrement'	: true
	});

    asyncTest('put', function () {
        expect(4);
        database.put({'test' : 'dataObj'}, database.iterate(info));
        start();
    });

    asyncTest('get', function () {
        expect(4);
        start();
    });

    asyncTest('remove', function () {
        expect(4);
        start();
    });

    asyncTest('getAll', function () {
        expect(4);
        start();
    });

    asyncTest('clear', function () {
        expect(4);
        start();
    });
});
