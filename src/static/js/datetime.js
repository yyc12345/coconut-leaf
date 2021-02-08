ccn_datetime_monthDayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

ccn_datetime_MIN_YEAR = 1950;
ccn_datetime_MAX_YEAR = 2199;
ccn_datetime_MIN_DATETIME = new Date(Date.UTC(1950, 1, 1, 0, 0, 0, 0));
ccn_datetime_MAX_DATETIME = new Date(Date.UTC(2200, 1, 1, 0, 0, 0, 0));
ccn_datetime_MIN_TIMESTAMP = Math.floor(ccn_datetime_MIN_DATETIME.getTime() / 60000);
ccn_datetime_MAX_TIMESTAMP = Math.floor(ccn_datetime_MAX_DATETIME.getTime() / 60000);

ccn_datetime_DAY1_SPAN = 60 * 24;
ccn_datetime_DAY7_SPAN = 7 * ccn_datetime_DAY1_SPAN;

ccn_datetime_precompiledLoopRules = {
    year: new RegExp(/^Y([SR]{1})([1-9]\d*)$/),
    month: new RegExp(/^M([SR]{1})([ABCD]{1})([1-9]\d*)$/),
    week: new RegExp(/^W([TF]{7})([1-9]\d*)$/),
    day: new RegExp(/^D([1-9]\d*)$/)
};

ccn_datetime_precompiledLoopStopRules = {
    infinity: new RegExp(/^F$/),
    datetime: new RegExp(/^D([1-9]\d*|0)$/),
    times: new RegExp(/^T([1-9]\d*)$/)
}

/* 
return format
[loopRules, loopStopRules] or undefined(invalid or no loop)

loopRules:
year loop: [0, isStrict, yearSpan]
month loop: [1, isStrict, monthMode, monthSpan]
week loop: [2, 7 bool item..., weekSpan]
day loop: [3, daySpan]

loopStopRules:
infinity: [0]
datetime: [1, timestamp]
times: [2, times]
*/
function ccn_datetime_ResolveLoopRules4UI(strl) {
    if (strl == '') return undefined;

    sp = strl.split('-');
    if (sp.length != 2) return undefined;
    var loopRules = undefined;
    var loopStopRules = undefined;

    if (ccn_datetime_precompiledLoopRules.year.test(sp[0])) {
        loopRules = [1, RegExp.$1 == 'S', parseInt(RegExp.$2)];
    } else if (ccn_datetime_precompiledLoopRules.month.test(sp[0])) {
        loopRules = [2, RegExp.$1 == 'S', RegExp.$2, parseInt(RedExp.$3)];
    } else if (ccn_datetime_precompiledLoopRules.week.test(sp[0])) {
        loopRules = [3];
        for (index in RegExp.$1) loopRules.push(RegExp.$1[index] == 'T');
        loopRules.push(parseInt(RegExp.$2));
    } else if (ccn_datetime_precompiledLoopRules.day.test(sp[0])) {
        loopRules = [4, parseInt(RegExp.$1)];
    } else return undefined;


    if (ccn_datetime_precompiledLoopStopRules.infinity.test(sp[1])) {
        loopStopRules = [0];
    } else if (ccn_datetime_precompiledLoopStopRules.datetime.test(sp[1])) {
        loopStopRules = [1, parseInt(RegExp.$1)];
    } else if (ccn_datetime_precompiledLoopStopRules.times.test(sp[1])) {
        loopStopRules = [2, parseInt(RegExp.$1)];
    } else return undefined;

    return [loopRules, loopStopRules];
}

function ccn_datetime_ResolveLoopRules4Event(strl) {
    return undefined;
}

function ccn_datetime_IsLeapYear(year) {
    var isLeap = false;
    if (year % 4 == 0) isLeap = true;
    if (year % 100 == 0) isLeap = false;
    if (year % 400 == 0) isLeap = true;
    return isLeap;
}
