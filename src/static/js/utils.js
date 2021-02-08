/*
function ComputPasswordWithSalt(password, salt) {
    return ComputeSHA256(ComputeSHA256(password) + salt.toString());
}

function ComputeSHA256(strl) {
    var tempstr = new TextEncoder().encode(strl);
    var hashedStrl = undefined
    var shitpromise = crypto.subtle.digest('SHA-256', tempstr);
    Promise.all(shitpromise).then(function(result) {
        hashedStrl = result;
    });
    var hashArray = Array.from(new Uint8Array(hashedStrl));
    var hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex.toLowerCase();
}
*/

function IsResponseOK(data) {
    if (typeof(data) == 'undefined') {
        console.log("Fail to execute an api!");
        return false;
    }
    if (!data['success']) {
        console.log("Fail to execute an api! Reason:");
        console.log(data['error']);
        return false;
    }
    return true;
}

function GetApiToken() {
    return ccn_localstorageAssist_Get('ccn-token', '');
}

function SetApiToken(value) {
    ccn_localstorageAssist_Set('ccn-token', value);
}

function LineBreaker2Br(strl) {
    return $('<div>').text(strl).html().replace(/\n/g,'<br />');
}

function IsUndefinedOrEmpty(data) {
    return (typeof(data) == 'undefined' || data == "");
}

function SmarterShowHide(boolean, element) {
    if (typeof(element) == 'undefined') return;
    if (boolean) element.show();
    else element.hide();
}