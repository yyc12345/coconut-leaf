// the api use bool to return status: fail: return false, true: return data(including true and false)
// the api use other type to return data: fail: return undefined, true: return data(if the returned value have change be null, return undefined instaed).

// var cached_salt = undefined

/*
function ccn_api_common_salt(_username) {
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

function ccn_api_common_login(_username, password) {
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
        ccn_localstorageAssist_SetApiToken(gotten_data['data']);
        cached_salt = undefined;
        return true;
    } else return false;
}
*/

// ============================================ template
// all api can be implemented by these 2 function, except 3 token related func.
// so all api func should use these 2 func except 3 token process api.
function ccn_api_dataTemplate(_url, _data) {
    // return data or undefined
    var gotten_data = undefined;
    $.ajax({
        url: _url,
        type: "POST",
        async: false,
        data: _data,
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data) && !(gotten_data['data'] === null)) return gotten_data['data'];
    else return undefined;
}

function ccn_api_boolTemplate(_url, _data) {
    // return true or false
    var gotten_data = undefined;
    $.ajax({
        url: _url,
        type: "POST",
        async: false,
        data: _data,
        success: function (data) {
            gotten_data = data;
        }
    });

    return (IsResponseOK(gotten_data) && gotten_data['data']);
}

// deserialize & serialize calendar description function

function ccn_api_serializeDescription(_description, _color) {
    var sobj = {
        description: _description,
        color: _color
    }
    return JSON.stringify(sobj);
}

function ccn_api_deserializeDescription(strl) {
    try {
        return $.parseJSON(strl);
    } catch(err) {
        return {
            description: "",
            color: DefaultColor
        };
    }
    
}

// ====================================================== common

function ccn_api_common_webLogin(_username, _password) {
    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/webLogin',
        type: "POST",
        async: false,
        data: {
            username: _username,
            password: _password
        },
        success: function (data) {
            gotten_data = data;
        }
    });
    if (IsResponseOK(gotten_data)) {
        ccn_localstorageAssist_SetApiToken(gotten_data['data']);
        return true;
    } else return false;
}

function ccn_api_common_logout() {
    // return true or false
    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/logout',
        type: "POST",
        async: false,
        data: {
            token: ccn_localstorageAssist_GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data) && gotten_data['data']) {
        ccn_localstorageAssist_SetApiToken('');
        return true;
    } return false;
}

function ccn_api_common_tokenValid() {
    // get from local database first, then judge it via post
    // return true or false
    var gotten_token = ccn_localstorageAssist_GetApiToken();
    if (gotten_token == '') return false;

    var gotten_data = undefined;
    $.ajax({
        url: '/api/common/tokenValid',
        type: "POST",
        async: false,
        data: {
            token: ccn_localstorageAssist_GetApiToken()
        },
        success: function (data) {
            gotten_data = data;
        }
    });

    if (IsResponseOK(gotten_data) && gotten_data['data']) return true;
    else {
        ccn_localstorageAssist_SetApiToken('');
        return false;
    }
}

// ====================================================== calendar

function ccn_api_calendar_getFull(_startDateTime, _endDateTime) {
    return ccn_api_dataTemplate(
        '/api/calendar/getFull',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            startDateTime: _startDateTime,
            endDateTime: _endDateTime
        }
    );
}

function ccn_api_calendar_getDetail(_uuid) {
    return ccn_api_dataTemplate(
        '/api/calendar/getDetail',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid
        }
    );
}

function ccn_api_calendar_update(_uuid, _belongTo, _title, _description, _eventDateTimeStart, _eventDateTimeEnd, _loopRules, _timezoneOffset, _lastChange) {
    var data = {};
    if (typeof(_belongTo) != 'undefined')
        data.belongTo = _belongTo;
    if (typeof(_title) != 'undefined')
        data.title = _title;
    if (typeof(_description) != 'undefined')
        data.description = _description;
    if (typeof(_eventDateTimeStart) != 'undefined')
        data.eventDateTimeStart = _eventDateTimeStart;
    if (typeof(_eventDateTimeEnd) != 'undefined')
        data.eventDateTimeEnd = _eventDateTimeEnd;
    if (typeof(_loopRules) != 'undefined')
        data.loopRules = _loopRules;
    if (typeof(_timezoneOffset) != 'undefined')
        data.timezoneOffset = _timezoneOffset;

    data.token = ccn_localstorageAssist_GetApiToken();
    data.uuid = _uuid;
    data.lastChange = _lastChange;
    return ccn_api_dataTemplate(
        '/api/calendar/update',
        data
    );
}

function ccn_api_calendar_add(_belongTo, _title, _description, _eventDateTimeStart, _eventDateTimeEnd, _loopRules, _timezoneOffset) {
    return ccn_api_dataTemplate(
        '/api/calendar/add',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            belongTo: _belongTo,
            title: _title,
            description: _description,
            eventDateTimeStart: _eventDateTimeStart,
            eventDateTimeEnd: _eventDateTimeEnd,
            loopRules: _loopRules,
            timezoneOffset: _timezoneOffset
        }
    );
}

function ccn_api_calendar_delete(_uuid, _lastChange) {
    return ccn_api_boolTemplate(
        '/api/calendar/delete',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            lastChange: _lastChange
        }
    );
}

// ====================================================== collection

function ccn_api_collection_getFullOwn() {
    return ccn_api_dataTemplate(
        '/api/collection/getFullOwn',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_collection_getDetailOwn(_uuid) {
    return ccn_api_dataTemplate(
        '/api/collection/getDetailOwn',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid
        }
    );
}

function ccn_api_collection_addOwn(_name) {
    return ccn_api_dataTemplate(
        '/api/collection/addOwn',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            name: _name
        }
    );
}

function ccn_api_collection_updateOwn(_uuid, _name, _lastChange) {
    return ccn_api_dataTemplate(
        '/api/collection/updateOwn',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            name: _name,
            lastChange: _lastChange
        }
    );
}

function ccn_api_collection_deleteOwn(_uuid, _lastChange) {
    return ccn_api_boolTemplate(
        '/api/collection/deleteOwn',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            lastChange: _lastChange
        }
    );
}

function ccn_api_collection_getSharing(_uuid) {
    return ccn_api_dataTemplate(
        '/api/collection/getSharing',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid
        }
    );
}

function ccn_api_collection_deleteSharing(_uuid, _target, _lastChange) {
    return ccn_api_dataTemplate(
        '/api/collection/deleteSharing',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            target: _target,
            lastChange: _lastChange
        }
    );
}

function ccn_api_collection_addSharing(_uuid, _target, _lastChange) {
    return ccn_api_dataTemplate(
        '/api/collection/addSharing',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            target: _target,
            lastChange: _lastChange
        }
    );
}

function ccn_api_collection_getShared() {
    return ccn_api_dataTemplate(
        '/api/collection/getShared',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

// ====================================================== todo

function ccn_api_todo_getFull() {
    return ccn_api_dataTemplate(
        '/api/todo/getFull',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_todo_add() {
    return ccn_api_dataTemplate(
        '/api/todo/add',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_todo_update(_uuid, _data, _lastChange) {
    return ccn_api_dataTemplate(
        '/api/todo/update',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            data: _data,
            lastChange: _lastChange
        }
    );
}

function ccn_api_todo_delete(_uuid, _lastChange) {
    return ccn_api_boolTemplate(
        '/api/todo/delete',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            uuid: _uuid,
            lastChange: _lastChange
        }
    );
}

// ====================================================== admin

function ccn_api_admin_get() {
    return ccn_api_dataTemplate(
        '/api/admin/get',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_admin_add(_username) {
    return ccn_api_dataTemplate(
        '/api/admin/add',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            username: _username
        }
    );
}

function ccn_api_admin_update(_username, _password, _isAdmin) {
    var data = {};
    if (typeof(_password) != 'undefined')
        data.password = _password;
    if (typeof(_isAdmin) != 'undefined')
        data.isAdmin = _isAdmin;

    if (Object.getOwnPropertyNames(data).length == 0) return false;
    data.token = ccn_localstorageAssist_GetApiToken();
    data.username = _username;
    return ccn_api_boolTemplate(
        '/api/admin/update',
        data
    );
}

function ccn_api_admin_delete(_username) {
    return ccn_api_boolTemplate(
        '/api/admin/delete',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            username: _username
        }
    );
}

// ====================================================== profile

function ccn_api_profile_isAdmin() {
    return ccn_api_boolTemplate(
        '/api/profile/isAdmin',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_profile_changePassword(_password) {
    return ccn_api_boolTemplate(
        '/api/profile/changePassword',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            password: _password
        }
    );
}

function ccn_api_profile_getToken() {
    return ccn_api_boolTemplate(
        '/api/profile/getToken',
        {
            token: ccn_localstorageAssist_GetApiToken()
        }
    );
}

function ccn_api_profile_deleteToken(_deleteToken) {
    return ccn_api_boolTemplate(
        '/api/profile/deleteToken',
        {
            token: ccn_localstorageAssist_GetApiToken(),
            deleteToken: _deleteToken
        }
    );
}
