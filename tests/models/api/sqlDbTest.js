define('tests/models/api/sqlDbTest', [
    'profiler/models/api/sqlDb',
    'interfaces/database',
    'lib/framework/utils'
], function (sqlDb, databaseInterface, utils) {

    module('Profiler.Models.Api.SqlDb');

    test('implements', function () {
        equal(utils.implement(sqlDb, databaseInterface), true, 'sqlDb implements the database interface');
    });
});