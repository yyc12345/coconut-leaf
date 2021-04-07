// NOTE: this file is sync with dt.py. if this file or dt.py have bugs, all code should be changed
var ccn_datetime_monthDayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

var ccn_datetime_MIN_YEAR = 1950;
var ccn_datetime_MAX_YEAR = 2200;
var ccn_datetime_MIN_DATETIME = new Date(Date.UTC(ccn_datetime_MIN_YEAR, 0, 1, 0, 0, 0, 0));
var ccn_datetime_MAX_DATETIME = new Date(Date.UTC(ccn_datetime_MAX_YEAR, 0, 1, 0, 0, 0, 0));
var ccn_datetime_MIN_TIMESTAMP = Math.floor(ccn_datetime_MIN_DATETIME.getTime() / 60000);
var ccn_datetime_MAX_TIMESTAMP = Math.floor(ccn_datetime_MAX_DATETIME.getTime() / 60000);

var ccn_datetime_DAY1_SPAN = 60 * 24;
var ccn_datetime_DAY7_SPAN = 7 * ccn_datetime_DAY1_SPAN;

var ccn_datetime_precompiledLoopRules = {
    year: new RegExp(/^Y([SR]{1})([1-9]\d*)$/),
    month: new RegExp(/^M([SR]{1})([ABCD]{1})([1-9]\d*)$/),
    week: new RegExp(/^W([TF]{7})([1-9]\d*)$/),
    day: new RegExp(/^D([1-9]\d*)$/)
};

var ccn_datetime_precompiledLoopStopRules = {
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

    var sp = strl.split('-');
    if (sp.length != 2) return undefined;
    var loopRules = undefined;
    var loopStopRules = undefined;

    if (ccn_datetime_precompiledLoopRules.year.test(sp[0])) {
        loopRules = [0, RegExp.$1 == 'S', parseInt(RegExp.$2)];
    } else if (ccn_datetime_precompiledLoopRules.month.test(sp[0])) {
        loopRules = [1, RegExp.$1 == 'S', RegExp.$2, parseInt(RegExp.$3)];
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

// loopDateTimeStart's value is not correspond with database.
// it is calculated by program, should be pointed to the closing
// protential event start datetime.
// also loopDateTimeEnd, it was clamped with the tail of legal event
// clampStartDateTime is real clamp datetime of event start datetime.
// loopDateTimeStart is the start datetime for detect.
// in this section, all time should be analysed with Date((time + timezoneOffset) * 60000)
// and use .getUTC...() functions.
function ccn_datetime_ResolveLoopRules4Event(loopRules, loopDateTimeStart, loopDateTimeEnd, eventDateTimeStart, eventDateTimeEnd, timezoneOffset, clampStartDateTime) {
    if (loopRules == '') return [
        [Math.max(eventDateTimeStart, clampStartDateTime), 
        Math.max(loopDateTimeEnd, eventDateTimeEnd)]
    ];

    var sp = loopRules.split('-');
    if (sp.length != 2) return undefined;
    var loopRules = sp[0];  // we don't need consider stop flag
    var result = new Array();

    // compute offset and duration
    var eventDateTime = new Date((eventDateTimeStart + timezoneOffset) * 60000);
    eventDateTime.setUTCHours(0, 0, 0, 0);
    var eventOffset = eventDateTimeStart - (Math.floor(eventDateTime.getTime() / 60000) - timezoneOffset);
    var eventDuration = eventDateTimeEnd - eventDateTimeStart;
    
    var detectDateTime = new Date(loopDateTimeStart * 60000);
    detectDateTime.setUTCHours(0, 0, 0, 0);
    var originalYear = eventDateTime.getUTCFullYear();
    var originalMonth = eventDateTime.getUTCMonth() + 1;
    var originalDay = eventDateTime.getUTCDate();

    // compute event
    if (ccn_datetime_precompiledLoopRules.year.test(loopRules)) {
        var isStrict = RegExp.$1 == 'S';
        var loopSpan = parseInt(RegExp.$2);
        
        var yearCount = detectDateTime.getFullYear() - originalYear;
        var isSpecial = (originalMonth == 2 && originalDay == 29);
        var realLoopSpan = (isSpecial && isStrict) ? LCM(4, loopSpan) : loopSpan;

        //var fullSpanCount = Math.floor(yearCount / realLoopSpan);
        var remainYear = yearCount % realLoopSpan;
        //detectDateTime.setUTCFullYear(fullSpanCount + detectDateTime.getUTCFullYear(), 1, 1);
        if (remainYear != 0)
            detectDateTime.setUTCFullYear(realLoopSpan - remainYear + detectDateTime.getUTCFullYear(), 1 - 1, 1);

        var skipFlag = false;
        while(Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset <= loopDateTimeEnd) {
            skipFlag = false;
            if (isSpecial) {
                // is special day, 29 Feb
                // try set it in 29 Feb
                if (isStrict) {
                    if (ccn_datetime_IsLeapYear(detectDateTime.getUTCFullYear())) detectDateTime.setUTCMonth(2 - 1, 29);
                    else skipFlag = true;  // order skip
                } else {
                    if (ccn_datetime_IsLeapYear(detectDateTime.getUTCFullYear())) detectDateTime.setUTCMonth(2 - 1, 29);
                    else detectDateTime.setUTCMonth(2 - 1, 28);
                }
            } else detectDateTime.setUTCMonth(originalMonth - 1, originalDay);

            if (!skipFlag) {
                result.push(
                    [Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset, 
                    Math.floor(detectDateTime.getTime() / 60000) + eventOffset + eventDuration - timezoneOffset]
                );
            }

            detectDateTime.setUTCFullYear(realLoopSpan + detectDateTime.getUTCFullYear());
        }

    } else if (ccn_datetime_precompiledLoopRules.month.test(loopRules)) {
        var isStrict = RegExp.$1 == 'S';
        var loopMethod = RegExp.$2;
        var loopSpan = parseInt(RegExp.$3);

        var monthsCount = ccn_datetime_MonthsCount(detectDateTime.getUTCFullYear(), detectDateTime.getUTCMonth() + 1) -
        ccn_datetime_MonthsCount(originalYear, originalMonth);

        //var fullSpanCount = Math.floor(monthsCount / loopSpan);
        var remainMonth = monthsCount % loopSpan;
        //detectDateTime.setUTCMonth(fullSpanCount * loopSpan + detectDateTime.getUTCMonth(), 1);
        detectDateTime.setUTCDate(1);
        if (remainMonth != 0)
            detectDateTime.setUTCMonth(loopSpan - remainMonth + detectDateTime.getUTCMonth(), 1);

        while(Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset <= loopDateTimeEnd) {
            var data = ccn_datetime_GetRemanagedDayInMonth(originalYear, originalMonth, originalDay, detectDateTime.getUTCFullYear(), detectDateTime.getUTCMonth() + 1, isStrict);
            var predictedDay = undefined;
            switch(loopMethod) {
                case 'A':
                    if (typeof(data[0]) != 'undefined') predictedDay = data[0];
                    break;
                case 'B':
                    if (typeof(data[1]) != 'undefined') predictedDay = data[1];
                    break;
                case 'C':
                    if (typeof(data[2]) != 'undefined') predictedDay = data[2];
                    break;
                case 'D':
                    if (typeof(data[3]) != 'undefined') predictedDay = data[3];
                    break;
            }
            if (typeof(predictedDay) != 'undefined') {
                detectDateTime.setUTCDate(predictedDay);
                result.push(
                    [Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset, 
                    Math.floor(detectDateTime.getTime() / 60000) + eventOffset + eventDuration - timezoneOffset]
                );
            }

            detectDateTime.setUTCMonth(loopSpan + detectDateTime.getUTCMonth(), 1);
        }


    } else if (ccn_datetime_precompiledLoopRules.week.test(loopRules)) {
        var loopSpan = parseInt(RegExp.$2);
        var weekOption = [];
        var weekEventCount = 0
        for (var i = 0; i < 7; i++) {
            weekOption.push(RegExp.$1[i] == 'T');
            if (RegExp.$1[i] == 'T') weekEventCount++;
        }

        var originalWeek = ccn_datetime_DayOfWeek(originalYear, originalMonth, originalDay);

        // try insert original event
        if (!weekOption[originalWeek]) {
            result.push(
                [eventDateTimeStart, eventDateTimeEnd]
            );
        }

        var daysCount = ccn_datetime_DaysCount(detectDateTime.getUTCFullYear(), detectDateTime.getUTCMonth() + 1, detectDateTime.getDate()) -
                        ccn_datetime_DaysCount(originalYear, originalMonth, originalDay);
        //var fullSpanCount = Math.floor(daysCount / (7 * loopSpan));
        var remainFullSpanCount = Math.floor((daysCount % (7 * loopSpan)) / 7);
        var remainDays = (daysCount % (7 * loopSpan)) % 7;
        
        //detectDateTime.setUTCDate((7 * loopSpan * fullSpanCount) + detectDateTime.getUTCDate());
        if (remainFullSpanCount != 0) {
            detectDateTime.setUTCDate((loopSpan - remainFullSpanCount) * 7 + detectDateTime.getUTCDate());
        }
        var weekCounter = remainDays;

        while(Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset <= loopDateTimeEnd) {
            if (weekOption[(weekCounter + originalWeek) % 7])
                result.push(
                    [Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset, 
                    Math.floor(detectDateTime.getTime() / 60000) + eventOffset + eventDuration - timezoneOffset]
                );

            weekCounter = (weekCounter + 1) % 7;
            detectDateTime.setUTCDate(detectDateTime.getUTCDate() + 1);
            if (weekCounter == 0)
                detectDateTime.setUTCDate(detectDateTime.getUTCDate() + (loopSpan - 1) * 7);         
        }

    } else if (ccn_datetime_precompiledLoopRules.day.test(loopRules)) {
        var loopSpan = parseInt(RegExp.$1);

        var daysCount = ccn_datetime_DaysCount(detectDateTime.getUTCFullYear(), detectDateTime.getUTCMonth() + 1, detectDateTime.getUTCDate()) -
                        ccn_datetime_DaysCount(originalYear, originalMonth, originalDay);
        //var fullSpanCount = Math.floor(daysCount / loopSpan);
        var remainDays = daysCount % loopSpan;
        //detectDateTime.setUTCDate(fullSpanCount * loopSpan + detectDateTime.getUTCDate());
        if (remainDays != 0) 
            detectDateTime.setUTCDate(loopSpan - remainDays + detectDateTime.getUTCDate());

        while(Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset <= loopDateTimeEnd) {
            result.push(
                [Math.floor(detectDateTime.getTime() / 60000) + eventOffset - timezoneOffset, 
                Math.floor(detectDateTime.getTime() / 60000) + eventOffset + eventDuration - timezoneOffset]
            );
            detectDateTime.setUTCDate(detectDateTime.getUTCDate() + loopSpan);
        }
    } else return undefined;

    // clamp item
    var realResult = [];
    for (var i in result) {
        var start = result[i][0];
        var end = result[i][1];
        if (end > clampStartDateTime && start <= loopDateTimeEnd)
            realResult.push([Math.max(start, clampStartDateTime), Math.min(end, loopDateTimeEnd)]);
    }
    return realResult;
}

function ccn_datetime_ResolveLoopRules4Text(loopRules) {
    return "";
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

function ccn_datetime_MonthsCount(year, month) {
    return (year - 1) * 12 + (month - 1);
}

function ccn_datetime_DayOfWeek(year, month, day) {
    return ccn_datetime_DaysCount(year, month, day) % 7;
}

function ccn_datetime_GetDayInMonth(year, month, day) {
    var days = ccn_datetime_monthDayCount[month - 1] + ((month == 2 && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
    var firstDayOfWeek = ccn_datetime_DayOfWeek(year, month, 1);
    var dayOfWeek = (firstDayOfWeek + day - 1) % 7;

    var dayForwards = day;
    var dayBackwards = days - day + 1;

    var weeksForward = Math.floor((dayForwards - 1) / 7) + 1;
    var weeksBackwards = Math.floor((dayBackwards - 1) / 7) + 1;

    return [dayForwards, dayBackwards, weeksForward, dayOfWeek, weeksBackwards, dayOfWeek];
}

function ccn_datetime_GetRemanagedDayInMonth(oldYear, oldMonth, oldDay, newYear, newMonth, isStrict) {
    var ddata = ccn_datetime_GetDayInMonth(oldYear, oldMonth, oldDay);
    var mdata = ccn_datetime_GetMonthWeekStatistics(newYear, newMonth);
    var days = ccn_datetime_monthDayCount[newMonth - 1] + ((newMonth == 2 && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
    var firstDayOfWeek = ccn_datetime_DayOfWeek(newYear, newMonth, 1);
    //var lastDayOfWeek = (firstDayOfWeek + days - 1) % 7;
    
    if (isStrict) {
        var methodA = ddata[0] > days ? undefined : ddata[0];
        var methodB = ddata[1] > days ? undefined : (days - ddata[1] + 1);
    } else {
        var methodA = Math.min(ddata[0], days);
        var methodB = days - Math.min(ddata[1], days) + 1;
    }

    var methodC = undefined;
    if (ddata[2] <= mdata[ddata[3]] || !isStrict) {
        var targetWeek = Math.min(ddata[2], mdata[ddata[3]]);
        methodC = 1 + (targetWeek - 1) * 7 + ((ddata[3] + 7 - firstDayOfWeek) % 7);
    }

    var methodD = undefined;
    if (ddata[4] <= mdata[ddata[5]] || !isStrict) {
        // convert to type c and calc
        var targetWeek = mdata[ddata[5]] - Math.min(ddata[4], mdata[ddata[5]]) + 1;
        methodD = 1 + (targetWeek - 1) * 7 + ((ddata[5] + 7 - firstDayOfWeek) % 7);
    }

    return [methodA, methodB, methodC, methodD];
}

function ccn_datetime_GetMonthWeekStatistics(year, month) {
    var days = ccn_datetime_monthDayCount[month - 1] + ((month == 2 && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
    var firstDayOfWeek = ccn_datetime_DayOfWeek(year, month, 1);

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
