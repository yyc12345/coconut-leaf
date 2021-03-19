var ccn_datetimepicker_tabType = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4
};

var ccn_datetimepicker_dialPlateRadius = 200;
var ccn_datetimepicker_dialPlateHalfRadius = ccn_datetimepicker_dialPlateRadius / 2;
var ccn_datetimepicker_dialPlateHourInnerPercent = 0.6;
var ccn_datetimepicker_dialPlateHourOutterPercent = 0.8;
var ccn_datetimepicker_dialPlateHourDistinguishPercent = 0.7;
var ccn_datetimepicker_dialPlateMinutePercent = 0.8;

var ccn_datetimepicker_mode = undefined;
var ccn_datetimepicker_pickerIndex = undefined;
var ccn_datetimepicker_isUTC = undefined;
var ccn_datetimepicker_callbackFunc = undefined;

var ccn_datetimepicker_internalDateTime = new Date();
var ccn_datetimepicker_displayCacheDateTime = new Date();

// ========================================= export func

function ccn_datetimepicker_Insert() {
    $('body').append(ccn_template_datetimepicker.render());

    // bind size event and trigge once
    $(window).resize(function (){
        $('div.pickerContainer > svg').each(function() {
            ccn_datetimepicker_OnSvgResize($(this));
        });
    }).resize();

    // add data attr
    for(var i = 0; i < 3; i++) {
        for(var j = 0; j < 4; j++) {
            $('#ccn-datetimepiacker-panelMonth-table > div:nth-child({0}) > div:nth-child({1})'.format(i + 1, j + 1))
            .attr('data', i * 4 + j);
        }
    }

    // bind header event
    $('header.pickerHeader > div').click(function() {
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_Str2TabType($(this).attr('type')));
    });

    // bind button event
    $('#ccn-datetimepiacker-panelYear-prevBtn').click(function() {
        ccn_datetimepicker_PrevNextYear(true);
    });
    $('#ccn-datetimepiacker-panelYear-nextBtn').click(function() {
        ccn_datetimepicker_PrevNextYear(false);
    });
    $('#ccn-datetimepiacker-panelMonth-prevBtn').click(function() {
        ccn_datetimepicker_PrevNextMonth(true);
    });
    $('#ccn-datetimepiacker-panelMonth-nextBtn').click(function() {
        ccn_datetimepicker_PrevNextMonth(false);
    });
    $('#ccn-datetimepiacker-panelDay-prevBtn').click(function() {
        ccn_datetimepicker_PrevNextDay(true);
    });
    $('#ccn-datetimepiacker-panelDay-nextBtn').click(function() {
        ccn_datetimepicker_PrevNextDay(false);
    });

    $('#ccn-datetimepiacker-panelYear-table > div > div').click(ccn_datetimepicker_ClickYear);
    $('#ccn-datetimepiacker-panelMonth-table > div > div').click(ccn_datetimepicker_ClickMonth);
    $('#ccn-datetimepiacker-panelDay-table > div:nth-child(n+1) > div').click(ccn_datetimepicker_ClickDay);

}

function ccn_datetimepicker_Modal(mode, pickerIndex, isUTC, callbackFunc) {
    ccn_datetimepicker_mode = mode;
    ccn_datetimepicker_pickerIndex = pickerIndex;
    ccn_datetimepicker_isUTC = isUTC;
    ccn_datetimepicker_callbackFunc = callbackFunc;

    ccn_datetimepicker_internalDateTime = ccn_datetimepicker_Get(pickerIndex, false);

    $('header.pickerHeader > div').hide();
    switch(mode) {
        case ccn_datetimepicker_tabType.minute:
            $('header.pickerHeader > div[type=minute]').show();
        case ccn_datetimepicker_tabType.hour:
            $('header.pickerHeader > div[type=hour]').show();
        case ccn_datetimepicker_tabType.day:
            $('header.pickerHeader > div[type=day]').show();
        case ccn_datetimepicker_tabType.month:
            $('header.pickerHeader > div[type=month]').show();
        case ccn_datetimepicker_tabType.year:
            $('header.pickerHeader > div[type=year]').show();
            break;
    }
    ccn_datetimepicker_SwitchTab(mode);

    $('#ccn-datetimepicker-modal').show();
}

// ========================================= internal func

function ccn_datetimepicker_OnSvgResize(ele) {
    var scale = 200 / Math.min(ele.width(), ele.height());
    ele.css('font-size', scale + 'em');
}

function ccn_datetimepicker_SwitchTab(newTab) {
    $('div.pickerContainer > *').hide();

    ccn_datetimepicker_displayCacheDateTime.setTime(ccn_datetimepicker_internalDateTime.getTime());
    ccn_datetimepicker_RefreshDisplay(newTab);

    switch(newTab) {
        case ccn_datetimepicker_tabType.year:
            $('#ccn-datetimepicker-panelYear').show();
            break;
        case ccn_datetimepicker_tabType.month:
            $('#ccn-datetimepicker-panelMonth').show();
            break;
        case ccn_datetimepicker_tabType.day:
            $('#ccn-datetimepicker-panelDay').show();
            break;
        case ccn_datetimepicker_tabType.hour:
            $('#ccn-datetimepicker-panelHour').show();
            break;
        case ccn_datetimepicker_tabType.minute:
            $('#ccn-datetimepicker-panelMinute').show();
            break;
    }
}

function ccn_datetimepicker_RefreshDisplay(tab) {
    // header should be refreshed entirely
    $('ccn-datetimepicker-datetime-year').text(ccn_datetimepicker_internalDateTime.getFullYear());
    $('ccn-datetimepicker-datetime-month').text(ccn_datetimepicker_internalDateTime.getMonth() + 1);
    $('ccn-datetimepicker-datetime-day').text(ccn_datetimepicker_internalDateTime.getDate());
    $('ccn-datetimepicker-datetime-hour').text(ccn_datetimepicker_internalDateTime.getHours());
    $('ccn-datetimepicker-datetime-minute').text(ccn_datetimepicker_internalDateTime.getMinutes());

    // refresh tab according to specific `tab`
    switch(tab) {
        case ccn_datetimepicker_tabType.year:
            var startYear = Math.floor((ccn_datetimepicker_displayCacheDateTime.getFullYear() - ccn_datetime_MIN_YEAR) / 12) * 12 + ccn_datetime_MIN_YEAR;
            var counter = startYear;
            for(var i = 0; i < 3; i++) {
                for(var j = 0; j < 4; j++, counter++) {
                    var ele = $('#ccn-datetimepiacker-panelYear-table > div:nth-child({0}) > div:nth-child({1})'.format(i + 1, j + 1));
                    if (counter < ccn_datetime_MAX_YEAR) {
                        ele.attr('data', counter)
                        .text(counter);
                    } else {
                        ele.attr('data', '')
                        .html('&nbsp;');
                    }

                    if (counter == ccn_datetimepicker_internalDateTime.getFullYear()) ele.attr('picked', 'true');
                    else ele.attr('picked', 'false');
                }
            }

            $('#ccn-datetimepiacker-panelYear-title')
            .text('{0} - {1}'.format(startYear, startYear + 12 < ccn_datetime_MAX_YEAR ? startYear + 12 : ccn_datetime_MAX_YEAR));

            break;
        case ccn_datetimepicker_tabType.month:
            $('#ccn-datetimepiacker-panelMonth-table > div > div').attr('picked', 'false');
            if (ccn_datetimepicker_internalDateTime.getFullYear() == ccn_datetimepicker_displayCacheDateTime.getFullYear()) {
                var month = ccn_datetimepicker_internalDateTime.getMonth();
                $('#ccn-datetimepiacker-panelMonth-table > div:nth-child({0}) > div:nth-child({1})'.format(Math.floor(month / 4), month % 4))
                .attr('picked', 'true');
            }

            $('#ccn-datetimepiacker-panelMonth-title')
            .text(ccn_datetimepicker_displayCacheDateTime.getFullYear());
            
            break;
        case ccn_datetimepicker_tabType.day:
            var gottenYear = ccn_datetimepicker_displayCacheDateTime.getFullYear();
            var gottenMonth = ccn_datetimepicker_displayCacheDateTime.getMonth() + 1;
            var counter = -ccn_datetime_DayOfWeek(gottenYear, gottenMonth,  1);
            var days = ccn_datetime_monthDayCount[gottenMonth - 1] + ((gottenMonth == 2 && ccn_datetime_IsLeapYear(year)) ? 1 : 0);
            for(var i = 0; i < 6; i++) {
                for(var j = 0; j < 7; j++, counter++) {
                    var ele = $('#ccn-datetimepiacker-panelDay-table > div:nth-child({0}) > div:nth-child({1})'.format(i + 2, j + 1));
                    if (counter < 0 || counter >= days) ele.attr('data', '').html('&nbsp;');
                    else ele.attr('data', counter + 1).text(counter + 1);
                    
                    if (counter + 1 == ccn_datetimepicker_internalDateTime.getDate()) ele.attr('picked', 'true');
                    else ele.attr('picked', 'false');
                }
            }

            $('#ccn-datetimepiacker-panelDay-title')
            .text('{0} - {1}'.format(
                ccn_datetimepicker_displayCacheDateTime.getFullYear(),
                ccn_i18n_UniversalGetMonth(ccn_datetimepicker_displayCacheDateTime.getMonth())
            ));

            break;
        case ccn_datetimepicker_tabType.hour:
            var gottenHour = ccn_datetimepicker_displayCacheDateTime.getHours();
            var newX = Math.cos((15 - gottenHour) * Math.PI * 2 / 60);
            var newY = Math.sin((15 - gottenHour) * Math.PI * 2 / 60);
            var radius = ccn_datetimepicker_dialPlateHalfRadius * (gottenHour < 12 ? ccn_datetimepicker_dialPlateHourOutterPercent : ccn_datetimepicker_dialPlateHourInnerPercent);
            newX = newX * radius + ccn_datetimepicker_dialPlateHalfRadius;
            newY = (-newY * radius) + ccn_datetimepicker_dialPlateHalfRadius;

            $('#ccn-datetimepicker-panelHour > line')
            .attr('x2', newX)
            .attr('y2', newY);

            $('#ccn-datetimepicker-panelHour > circle[type=symbol]')
            .attr('cx', newX)
            .attr('cy', newY);
            
            break;
        case ccn_datetimepicker_tabType.minute:
            var gottenMinute = ccn_datetimepicker_displayCacheDateTime.getMinutes();
            var newX = Math.cos((15 - gottenMinute) * Math.PI * 2 / 60);
            var newY = Math.sin((15 - gottenMinute) * Math.PI * 2 / 60);
            var radius = ccn_datetimepicker_dialPlateHalfRadius * ccn_datetimepicker_dialPlateMinutePercent;
            newX = newX * radius + ccn_datetimepicker_dialPlateHalfRadius;
            newY = (-newY * radius) + ccn_datetimepicker_dialPlateHalfRadius;

            $('#ccn-datetimepicker-panelMinute > line')
            .attr('x2', newX)
            .attr('y2', newY);

            $('#ccn-datetimepicker-panelMinute > circle[type=symbol]')
            .attr('cx', newX)
            .attr('cy', newY);
            
            break;
    }
}

function ccn_datetimepicker_Str2TabType(strl) {
    switch(strl) {
        case 'year':
            return ccn_datetimepicker_tabType.year
        case 'month':
            return ccn_datetimepicker_tabType.month
        case 'day':
            return ccn_datetimepicker_tabType.day
        case 'hour':
            return ccn_datetimepicker_tabType.hour
        case 'minute':
            return ccn_datetimepicker_tabType.minute
    }
    return undefined;
}

function ccn_datetimepicker_PrevNextYear(isPrev) {

}

function ccn_datetimepicker_PrevNextMonth(isPrev) {
    
}

function ccn_datetimepicker_PrevNextDay(isPrev) {
    
}

function ccn_datetimepicker_ClickYear() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setFullYear(parseInt(ele.attr('data')));
    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.year)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.month);
}

function ccn_datetimepicker_ClickMonth() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setMonth(parseInt(ele.attr('data')));
    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.month)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.day);
}

function ccn_datetimepicker_ClickDay() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setDate(parseInt(ele.attr('data')));
    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.day)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.hour);
}

/*

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
*/

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
