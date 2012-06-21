define('interfaces/database', function () {
    var Database = {
        'put'       : function (data, onSuccess, onError) {},
        'get'       : function (key, onSuccess, onError) {},
        'remove'    : function (key, onSuccess, onError) {},
        'clear'     : function (onSuccess, onError) {}
    };

    return Database;
});
