var ccn_datetimepicker_tabType = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4
};
var ccn_datetimepicker_currentTab = undefined;

var ccn_datetimepicker_mode = undefined;
var ccn_datetimepicker_pickerIndex = undefined;
var ccn_datetimepicker_isUTC = undefined;
var ccn_datetimepicker_callbackFunc = undefined;

var internalDateTime = new Date();

// ========================================= export func

function ccn_datetimepicker_Insert() {
    $('body').append(ccn_template_datetimepicker.render());

    // bind event and trigge once
    $(window).resize(function (){
        $('div.pickerContainer > svg').each(function (){
            ccn_datetimepicker_OnSvgResize($(this));
        });
    }).resize();
}

function ccn_datetimepicker_Modal(mode, pickerIndex, isUTC, callbackFunc) {
    ccn_datetimepicker_mode = mode;
    ccn_datetimepicker_pickerIndex = pickerIndex;
    ccn_datetimepicker_isUTC = isUTC;
    ccn_datetimepicker_callbackFunc = callbackFunc;

    ccn_datetimepicker_SwitchTab(mode);

    $('#ccn-datetimepicker-modal').show();
}

// ========================================= internal func

function ccn_datetimepicker_OnSvgResize(ele) {
    var scale = 200 / Math.min(ele.width(), ele.height());
    ele.css('font-size', scale + 'em');
}

function ccn_datetimepicker_SwitchTab(newTab) {
    $('div.pickerContainer > svg').hide();
    switch(newTab) {
        case ccn_datetimepicker_tabType.year:
            $('#ccn-datetimepicker-panel-year').show();
            break;
        case ccn_datetimepicker_tabType.month:
            $('#ccn-datetimepicker-panel-month').show();
            break;
        case ccn_datetimepicker_tabType.day:
            $('#ccn-datetimepicker-panel-day').show();
            break;
        case ccn_datetimepicker_tabType.hour:
            ccn_datetimepicker_OnSvgResize($('#ccn-datetimepicker-panel-hour').show());
            break;
        case ccn_datetimepicker_tabType.minute:
            ccn_datetimepicker_OnSvgResize($('#ccn-datetimepicker-panel-minute').show());
            break;
    }
}

function ccn_datetimepicker_RefreshDisplayDateTime() {

}


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

function ccn_datetimepicker_Set(pickerIndex, dt, isUTC, mode) {
    var ele = $('[datetimepicker=' + pickerIndex + ']');
    if (mode < ccn_datetimepicker_tabType.year) return;
    ele.attr('datetimepicker-year', isUTC ? dt.getUTCFullYear() : dt.getFullYear());
    if (mode < ccn_datetimepicker_tabType.month) return;
    ele.attr('datetimepicker-month', (isUTC ? dt.getUTCMonth() : dt.getMonth()) + 1);
    if (mode < ccn_datetimepicker_tabType.day) return;
    ele.attr('datetimepicker-day', isUTC ? dt.getUTCDate() : dt.getDate());
    if (mode < ccn_datetimepicker_tabType.hour) return;
    ele.attr('datetimepicker-hour', isUTC ? dt.getUTCHours() : dt.getHours());
    if (mode < ccn_datetimepicker_tabType.minute) return;
    ele.attr('datetimepicker-minute', isUTC ? dt.getUTCMinutes() : dt.getMinutes());
}

function ccn_datetimepicker_Get(pickerIndex, isUTC) {
    var ele = $('[datetimepicker=' + pickerIndex + ']');
    year = ele.attr('datetimepicker-year');
    month = ele.attr('datetimepicker-month');
    day = ele.attr('datetimepicker-day');
    hour = ele.attr('datetimepicker-hour');
    minute = ele.attr('datetimepicker-minute');
    if (IsUndefinedOrEmpty(year)) year = ccn_datetime_MIN_YEAR;
    if (IsUndefinedOrEmpty(month)) month = 1;
    if (IsUndefinedOrEmpty(day)) day = 1;
    if (IsUndefinedOrEmpty(hour)) hour = 0;
    if (IsUndefinedOrEmpty(minute)) minute = 0;

    if (isUTC) return new Date(Date.UTC(year, parseInt(month) - 1, day, hour, minute, 0, 0));
    else return new Date(year, parseInt(month) - 1, day, hour, minute, 0, 0);
}
