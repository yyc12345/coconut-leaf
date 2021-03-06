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
var DefaultColor = '#536dfe';

function IsResponseOK(data) {
    if (typeof (data) == 'undefined') {
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

function LineBreaker2Br(strl) {
    return $('<div>').text(strl).html().replace(/\n/g, '<br />');
}

function IsUndefinedOrEmpty(data) {
    return (typeof (data) == 'undefined' || data == "");
}

function SmarterShowHide(boolean, element) {
    if (typeof (element) == 'undefined') return;
    if (boolean) element.show();
    else element.hide();
}

function GCD(a, b) {
    if (b == 0) return a;
    return GCD(b, a % b);
}

function LCM(a, b) {
    return a / GCD(a, b) * b;
}

String.prototype.format = function() { 
    var e = arguments; 
    return !!this && this.replace(
        /\{(\d+)\}/g, 
        function (t, n) { 
            return e[n].toString() ? e[n].toString() : t;
        }
    );
};

Date.prototype.getWeekday = function() {
    var temp = this.getDay();
    if (temp == 0) return 6;
    else return temp - 1;
};