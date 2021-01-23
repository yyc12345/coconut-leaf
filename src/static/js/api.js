// var cached_salt = undefined

/*
function cnn_api_common_salt(_username) {
    // true or false
    // gotten salt store in cached_salt.
    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/salt',
        type: "POST",
        async: false,
        data: {
            username: _username
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) {
        cached_salt = gotten_data['data'];
        return true;
    } else return false;
}

function cnn_api_common_login(_username, password) {
    // return true or false, token is managed by this js file self.
    // if cached_salt is undefined, return false directly
    if (typeof(cached_salt) == undefined) return false;

    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/login',
        type: "POST",
        async: false,
        data: {
            username: _username,
            password: ComputPasswordWithSalt(password, cached_salt)
        },
        success: function (data) {
            gotten_data = data;
        }
    });
    if (IsResponseOK(gotten_data) && gotten_data['data'] != '') {
        SetApiToken(gotten_data['data']);
        cached_salt = undefined;
        return true;
    } else return false;
}
*/

// ====================================================== common

function cnn_api_common_webLogin(_username, password) {
    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/webLogin',
        type: "POST",
        async: false,
        data: {
            username: _username,
            password: password
        },
        success: function (data) {
            gotten_data = data;
        }
    });
    if (IsResponseOK(gotten_data)) {
        SetApiToken(gotten_data['data']);
        return true;
    } else return false;
}

function cnn_api_common_logout() {
    // return true or false
    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/logout',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) {
        SetApiToken('');
        return true;
    } return false;
}

function cnn_api_common_tokenValid() {
    // get from local database first, then judge it via post
    // return true or false
    var gotten_token = GetApiToken();
    if (gotten_token == '') return false;

    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/tokenValid',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) return true;
    else {
        SetApiToken('');
        return false;
    }
}

// ====================================================== calendar





// ====================================================== collection



// ====================================================== todo

function cnn_api_todo_getFull() {
    // return data or undefined
    var gotten_data = undefined;
    $.ajax({
        url: '/api/todo/getFull',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) return gotten_data['data'];
    else return undefined;
}

function cnn_api_todo_add() {
    // return data or undefined
    var gotten_data = undefined;
    $.ajax({
        url: '/api/todo/add',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) return gotten_data['data'];
    else return undefined;
}

function cnn_api_todo_update(_uuid, _data, _lastChange) {
    // return data or undefined
    var gotten_data = undefined;
    $.ajax({
        url: '/api/todo/update',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken(),
            uuid: _uuid,
            data: _data,
            lastChange: _lastChange
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data)) return gotten_data['data'];
    else return undefined;
}

function cnn_api_todo_delete(_uuid, _lastChange) {
    // return true or false
    var gotten_data = undefined;
    $.ajax({
        url: '/api/todo/delete',
        type: "POST",
        async: false,
        data: {
            token: GetApiToken(),
            uuid: _uuid,
            lastChange: _lastChange
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    return IsResponseOK(gotten_data);
}

// ====================================================== admin



