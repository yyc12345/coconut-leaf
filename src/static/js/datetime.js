ccn_datetime_monthDayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

ccn_datetime_MIN_YEAR = 1950;
ccn_datetime_MAX_YEAR = 2199;
ccn_datetime_MIN_DATETIME = new Date(Date.UTC(1950, 1, 1, 0, 0, 0, 0));
ccn_datetime_MAX_DATETIME = new Date(Date.UTC(2200, 1, 1, 0, 0, 0, 0));
ccn_datetime_MIN_TIMESTAMP = Math.floor(ccn_datetime_MIN_DATETIME.getTime() / 60000);
ccn_datetime_MAX_TIMESTAMP = Math.floor(ccn_datetime_MAX_DATETIME.getTime() / 60000);

ccn_datetime_DAY1_SPAN = 60 * 24;
ccn_datetime_DAY7_SPAN = 7 * ccn_datetime_DAY1_SPAN;

function ccn_datetime_IsLeapYear(year) {
    var isLeap = true;
    if (year % 4 == 0) isLeap = true;
    if (year % 100 == 0) isLeap = false;
    if (year % 400 == 0) isLeap = true;
    return isLeap;
}
