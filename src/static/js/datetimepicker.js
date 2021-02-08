function ccn_datetimepicker_Init() {
    var nowtime = new Date();

    $('.datetimepicker-year').attr('min', ccn_datetime_MIN_YEAR)
    .attr('max', ccn_datetime_MAX_YEAR)
    .attr('step', 1)
    .val(nowtime.getFullYear())
    .bind('input propertychange', ccn_datetimepicker_Sync);

    $('.datetimepicker-month').attr('min', 1)
    .attr('max', 12)
    .attr('step', 1)
    .val(nowtime.getMonth() + 1)
    .bind('input propertychange', ccn_datetimepicker_Sync);

    $('.datetimepicker-day').attr('min', 1)
    .attr('step', 1)
    .each(function(){
        ccn_datetimepicker_SyncEx($(this).attr("datetimepicker"));
    })
    .val(nowtime.getDate());
    
    $('.datetimepicker-hour').attr('min', 0)
    .attr('max', 23)
    .attr('step', 1)
    .val(nowtime.getHours());

    $('.datetimepicker-minute').attr('min', 0)
    .attr('max', 59)
    .attr('step', 1)
    .val(nowtime.getMinutes());
}

function ccn_datetimepicker_Sync() {
    var pickerIndex = $(this).attr("datetimepicker");
    ccn_datetimepicker_SyncEx(pickerIndex);
}

function ccn_datetimepicker_SyncEx(pickerIndex) {
    year = parseInt($('.datetimepicker-year[datetimepicker=' + pickerIndex + ']').val());
    month = parseInt($('.datetimepicker-month[datetimepicker=' + pickerIndex + ']').val());

    dayDOM = $('.datetimepicker-day[datetimepicker=' + pickerIndex + ']');
    if (typeof(year) == 'undefined' || typeof(month) == 'undefined') {
        dayDOM.attr('max', 1)
        .val(1);
    } else {
        dayDOM.attr('max', ccn_datetime_monthDayCount[month - 1] + ((month == 2 && ccn_datetime_IsLeapYear(year) ? 1 : 0)))
        .val(1);
    }
}

function ccn_datetimepicker_Set(pickerIndex, dt) {
    $('.datetimepicker-year[datetimepicker=' + pickerIndex + ']').val(dt.getFullYear());
    $('.datetimepicker-month[datetimepicker=' + pickerIndex + ']').val(dt.getMonth() + 1);
    $('.datetimepicker-day[datetimepicker=' + pickerIndex + ']').val(dt.getDate());
    $('.datetimepicker-hour[datetimepicker=' + pickerIndex + ']').val(dt.getHours());
    $('.datetimepicker-minute[datetimepicker=' + pickerIndex + ']').val(dt.getMinutes());
}

function ccn_datetimepicker_Get(pickerIndex) {
    year = $('.datetimepicker-year[datetimepicker=' + pickerIndex + ']').val();
    month = $('.datetimepicker-month[datetimepicker=' + pickerIndex + ']').val();
    day = $('.datetimepicker-day[datetimepicker=' + pickerIndex + ']').val();
    hour = $('.datetimepicker-hour[datetimepicker=' + pickerIndex + ']').val();
    minute = $('.datetimepicker-minute[datetimepicker=' + pickerIndex + ']').val();
    if (IsUndefinedOrEmpty(year)) year = ccn_datetime_MIN_YEAR;
    if (IsUndefinedOrEmpty(month)) month = 1;
    if (IsUndefinedOrEmpty(day)) day = 1;
    if (IsUndefinedOrEmpty(hour)) hour = 0;
    if (IsUndefinedOrEmpty(minute)) minute = 0;

    return new Date(year, parseInt(month) - 1, day, hour, minute, 0, 0);
}
