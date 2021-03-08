function ccn_localstorageAssist_Get(index, defaultValue) {
    var cache = localStorage.getItem(index);
    if (cache == null) {
        ccn_localstorageAssist_Set(index, defaultValue);
        return defaultValue;
    } else return cache;
}

function ccn_localstorageAssist_Set(index, value) {
    localStorage.setItem(index, value);
}

// =================================== seperated data getter setter

function ccn_localstorageAssist_GetApiToken() {
    return ccn_localstorageAssist_Get('ccn-token', '');
}

function ccn_localstorageAssist_SetApiToken(value) {
    ccn_localstorageAssist_Set('ccn-token', value);
}
