define('interfaces/database', function () {
    return {
        'put'       : function (data, onSuccess, onError) {},
        'get'       : function (key, onSuccess, onError) {},
        'remove'    : function (key, onSuccess, onError) {},
        'clear'     : function (onSuccess, onError) {},
        'openDB'    : function (options, onStoreReady) {},
        'getAll'    : function (onSuccess, onError) {}
    };
});
