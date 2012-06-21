define('tests/profiler/models/indexedDbTest', [
    'profiler/models/api/indexedDb'
], function (indexedDb) {
console.log(indexedDb);
    module('Profiler.Models.Api.IndexedDb');

    var database = new indexedDb({
        'dbName'        : 'IDB',
        'storeName'     : 'Store',
        'dbVersion'     : 1,
        'keyPath'       : 'id',
        'autoIncrement' : true
    });

/*    asyncTest('put', function () {
        expect(4);
        database.put({'test' : 'dataObj'}, database.getAll(console.log));
        start();
    });*/

    /*asyncTest('get', function () {
        //expect(4);
        start();
    });

    asyncTest('remove', function () {
        //expect(4);
        start();
    });

    asyncTest('getAll', function () {
        //expect(4);
        start();
    });

    asyncTest('clear', function () {
        //expect(4);
        start();
    });*/
});
