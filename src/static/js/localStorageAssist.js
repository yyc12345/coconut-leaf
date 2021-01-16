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