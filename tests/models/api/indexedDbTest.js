define('tests/models/api/indexedDbTest', [
    'profiler/models/api/indexedDb',
    'interfaces/database',
    'lib/framework/utils'
], function (indexedDb, databaseInterface, utils) {

    module('Profiler.Models.Api.IndexedDb');

    function startTests() {

        test('implements', function () {
            equal(utils.implement(indexedDb, databaseInterface), true, 'indexedDb implements the database interface');
        });

        asyncTest('put & get & remove', function () {

            expect(3);

            indexedDb.clear(function () {
                equal(1, 1, 'cleared the database ready for tests');
                indexedDb.put({'test' : 'data'}, function (key) {
                    indexedDb.get(key, function (result) {
                        equal(result.test, 'data', 'data inserted into database and retrived correct test object');

                        indexedDb.remove(key, function (result) {
                            equal(typeof result, 'undefined', 'data has been successfully removed from the db');
                            start();
                        });
                    });
                });
            });
        });

        asyncTest('getAll and clear database', function () {

            expect(2);

            indexedDb.put({'test' : 'data'}, function (key) {
                indexedDb.put({'more' : 'data'}, function (key) {
                    indexedDb.getAll(function (result) {
                        equal(result.length, 2, 'data inserted into database and retrived correct amount of database entries');

                        indexedDb.clear(function (result) {
                            equal(typeof result, 'undefined', 'all data has been successfully removed from the db');
                            start();
                        });
                    });
                });
            });
        });

        asyncTest('iterate over the database', function () {

            var counter = 0;

            expect(1);

            indexedDb.put({'test' : 'data'}, function (key) {
                indexedDb.put({'more' : 'data'}, function (key) {
                    indexedDb.iterate(function () {
                        counter++;
                    }, {
                        'onEnd' : function() {
                            equal(counter, 2, 'iterated over the correct amount of database entries');
                            info('Tests complete');
                            start();
                        }
                    });
                });
            });
        });
    }

    indexedDb.openDB({
        'dbName'        : 'IDB',
        'storeName'     : 'Store',
        'dbVersion'     : 1,
        'keyPath'       : 'id',
        'autoIncrement' : true
    }, startTests);
});