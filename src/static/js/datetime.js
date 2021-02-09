// NOTE: this file is sync with dt.py. if this file or dt.py have bugs, all code should be changed
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
        loopRules = [0, RegExp.$1 == 'S', parseInt(RegExp.$2)];
    } else if (ccn_datetime_precompiledLoopRules.month.test(sp[0])) {
        loopRules = [1, RegExp.$1 == 'S', RegExp.$2, parseInt(RedExp.$3)];
    } else if (ccn_datetime_precompiledLoopRules.week.test(sp[0])) {
        loopRules = [2];
        for (var i = 0; i < 7; i++)
            loopRules.push(RegExp.$1[i] == 'T');
        loopRules.push(parseInt(RegExp.$2));
    } else if (ccn_datetime_precompiledLoopRules.day.test(sp[0])) {
        loopRules = [3, parseInt(RegExp.$1)];
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

function ccn_datetime_LeapYearCountEx(endYear, includeThis, baseYear, includeBase) {
    if (!includeThis) endYear--;
    if (includeBase) baseYear--;

    var endly = Math.floor(endYear / 4);
    endly -= Math.floor(endYear / 100);
    endly += Math.floor(endYear / 400);

    var basely = Math.floor(baseYear / 4);
    basely -= Math.floor(baseYear / 100);
    basely += Math.floor(baseYear / 400);

    return (endly - basely);
}

function ccn_datetime_DaysCount(year, month, day) {
    var ly = ccn_datetime_LeapYearCountEx(year, false, 1, true);
    var days = 365 * (year - 1);
    days += ly;

    for(var index = 1; index < month; index++)
        days += ccn_datetime_monthDayCount[index - 1];

    if (month > 2 && ccn_datetime_IsLeapYear(year))
        days += 1;

    days += day - 1;
    return days;
}

function ccn_datetime_DayOfWeek(year, month, day) {
    return ccn_datetime_DaysCount(year, month, day) % 7;
}

function ccn_datetime_GetDayInMonth(year, month, day) {
    var days = ccn_datetime_monthDayCount[month - 1] + ((month == '2' && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
    var firstDayOfWeek = ccn_datetime_DayOfWeek(year, month, 1);
    var dayOfWeek = (firstDayOfWeek + day - 1) % 7;

    var dayForwards = day;
    var dayBackwards = days - day + 1;

    var weeksForward = Math.floor((dayForwards - 1) / 7) + 1;
    var weeksBackwards = Math.floor((dayBackwards - 1) / 7) + 1;

    return [dayForwards, dayBackwards, weeksForward, dayOfWeek, weeksBackwards, dayOfWeek];
}

function ccn_datetime_GetMonthWeekStatistics(year, month) {
    var days = ccn_datetime_monthDayCount[month - 1] + ((month == '2' && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
    var firstDayOfWeek = ccn_datetime_DayOfWeek(year, month, 1);
    var lastDayOfWeek = (firstDayOfWeek + days - 1) % 7;

    var result = [4, 4, 4, 4, 4, 4, 4];
    var remain = days % 7;
    var week = firstDayOfWeek;
    while (remain > 0) {
        result[week % 7] += 1;
        week++;
        remain--;
    }

    return result;
}

function ccn_datetime_IsLeapYear(year) {
    var isLeap = false;
    if (year % 4 == 0) isLeap = true;
    if (year % 100 == 0) isLeap = false;
    if (year % 400 == 0) isLeap = true;
    return isLeap;
}
