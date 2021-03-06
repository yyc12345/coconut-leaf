var ccn_datetimepicker_tabType = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4
};

var ccn_datetimepicker_dialPlateWidth = 200;
var ccn_datetimepicker_dialPlateRadius = ccn_datetimepicker_dialPlateWidth / 2;
var ccn_datetimepicker_dialPlateHourInnerPercent = 0.6;
var ccn_datetimepicker_dialPlateHourOutterPercent = 0.8;
var ccn_datetimepicker_dialPlateHourDistinguishPercent = 0.7;
var ccn_datetimepicker_dialPlateMinutePercent = 0.8;
var ccn_datetimepicker_dialPlateHourResolution = Math.PI * 2 / 12;
var ccn_datetimepicker_dialPlateMinuteResolution = Math.PI * 2 / 60;

var ccn_datetimepicker_mode = undefined;
var ccn_datetimepicker_isUTC = undefined;
var ccn_datetimepicker_pickerIndex = undefined;

var ccn_datetimepicker_enableMinuteDrag = false;
var ccn_datetimepicker_enableHourDrag = false;

var ccn_datetimepicker_internalDateTime = new Date();
var ccn_datetimepicker_displayCacheDateTime = new Date();

// ========================================= export func

function ccn_datetimepicker_Insert() {
    $('body').append(ccn_template_datetimepicker.render());

    // bind size event and trigge once
    $(window).resize(ccn_datetimepicker_RefreshSvg).resize();

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

    $('#ccn-datetimepicker-panelHour')
    .mousedown(ccn_datetimepicker_StartDragHour)
    .mousemove(ccn_datetimepicker_DraggingHour)
    .mouseup(ccn_datetimepicker_StopDragHour)
    .on('touchstart', ccn_datetimepicker_StartDragHour)
    .on('touchmove', ccn_datetimepicker_DraggingHour)
    .on('touchend', ccn_datetimepicker_StopDragHour);

    $('#ccn-datetimepicker-panelMinute')
    .mousedown(ccn_datetimepicker_StartDragMinute)
    .mousemove(ccn_datetimepicker_DraggingMinute)
    .mouseup(ccn_datetimepicker_StopDragMinute)
    .on('touchstart', ccn_datetimepicker_StartDragMinute)
    .on('touchmove', ccn_datetimepicker_DraggingMinute)
    .on('touchend', ccn_datetimepicker_StopDragMinute);

    $('#ccn-datetimepicker-btnConfirm').click(ccn_datetimepicker_Confirm);
    $('#ccn-datetimepicker-btnCancel').click(ccn_datetimepicker_Cancel);

}

function ccn_datetimepicker_Modal(mode, pickerIndex, isUTC) {
    ccn_datetimepicker_mode = mode;
    ccn_datetimepicker_isUTC = isUTC;
    ccn_datetimepicker_pickerIndex = pickerIndex;

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

    $('#ccn-datetimepicker-modal').addClass('is-active');
    ccn_datetimepicker_SwitchTab(mode); // this call is set in there by design. if you don't show the dialog, the call of svg resize will fail.
}

function ccn_datetimepicker_Confirm() {
    // update and call callback func
    ccn_datetimepicker_Set(
        ccn_datetimepicker_pickerIndex, 
        ccn_datetimepicker_internalDateTime, 
        ccn_datetimepicker_isUTC, 
        ccn_datetimepicker_mode
    );

    $('#ccn-datetimepicker-modal').removeClass('is-active');
}

function ccn_datetimepicker_Cancel() {
    $('#ccn-datetimepicker-modal').removeClass('is-active');
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
            ccn_datetimepicker_RefreshSvg();    // immediately trigger once svg resize
            break;
        case ccn_datetimepicker_tabType.minute:
            $('#ccn-datetimepicker-panelMinute').show();
            ccn_datetimepicker_RefreshSvg();    // immediately trigger once svg resize
            break;
    }
}

function ccn_datetimepicker_RefreshDisplay(tab) {
    // header should be refreshed entirely
    $('#ccn-datetimepicker-datetime-year').text(ccn_datetimepicker_internalDateTime.getFullYear());
    $('#ccn-datetimepicker-datetime-month').text(ccn_datetimepicker_internalDateTime.getMonth() + 1);
    $('#ccn-datetimepicker-datetime-day').text(ccn_datetimepicker_internalDateTime.getDate());
    $('#ccn-datetimepicker-datetime-hour').text(ccn_datetimepicker_internalDateTime.getHours());
    $('#ccn-datetimepicker-datetime-minute').text(ccn_datetimepicker_internalDateTime.getMinutes());

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
                $('#ccn-datetimepiacker-panelMonth-table > div:nth-child({0}) > div:nth-child({1})'.format(Math.floor(month / 4) + 1, (month % 4) + 1))
                .attr('picked', 'true');
            }

            $('#ccn-datetimepiacker-panelMonth-title')
            .text(ccn_datetimepicker_displayCacheDateTime.getFullYear());
            
            break;
        case ccn_datetimepicker_tabType.day:
            var gottenYear = ccn_datetimepicker_displayCacheDateTime.getFullYear();
            var gottenMonth = ccn_datetimepicker_displayCacheDateTime.getMonth() + 1;
            var counter = -ccn_datetime_DayOfWeek(gottenYear, gottenMonth,  1);
            var days = ccn_datetime_monthDayCount[gottenMonth - 1] + ((gottenMonth == 2 && ccn_datetime_IsLeapYear(gottenYear)) ? 1 : 0);
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
            var newX = Math.cos((3 - gottenHour) * Math.PI * 2 / 12);
            var newY = Math.sin((3 - gottenHour) * Math.PI * 2 / 12);
            var radius = ccn_datetimepicker_dialPlateRadius * (gottenHour < 12 ? ccn_datetimepicker_dialPlateHourOutterPercent : ccn_datetimepicker_dialPlateHourInnerPercent);
            newX = newX * radius + ccn_datetimepicker_dialPlateRadius;
            newY = (-newY * radius) + ccn_datetimepicker_dialPlateRadius;

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
            var radius = ccn_datetimepicker_dialPlateRadius * ccn_datetimepicker_dialPlateMinutePercent;
            newX = newX * radius + ccn_datetimepicker_dialPlateRadius;
            newY = (-newY * radius) + ccn_datetimepicker_dialPlateRadius;

            $('#ccn-datetimepicker-panelMinute > line')
            .attr('x2', newX)
            .attr('y2', newY);

            $('#ccn-datetimepicker-panelMinute > circle[type=symbol]')
            .attr('cx', newX)
            .attr('cy', newY);
            
            break;
    }
}

function ccn_datetimepicker_RefreshSvg() {
    // svg resize only can be called when the svg is showing.
    // so call this func in window resize event or
    // displaying svg.
    $('div.pickerContainer > svg').each(function() {
        ccn_datetimepicker_OnSvgResize($(this));
    });
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

function ccn_datetimepicker_GetUniformedXY(mouseOrTouchEvent, elements) {
    var offset = {
        left: elements.offset().left,
        top: elements.offset().top,
        halfWidth: elements.width() / 2,
        halfHeight: elements.height() / 2,
        halfSquareWidthHeight: Math.min(elements.width(), elements.height()) / 2
    }
    if(typeof(mouseOrTouchEvent.pageX) != 'undefined' && typeof(mouseOrTouchEvent.pageY) != 'undefined') {
        offset.realX = mouseOrTouchEvent.pageX;
        offset.realY = mouseOrTouchEvent.pageY;
    } else if(typeof(mouseOrTouchEvent.targetTouches) != 'undefined' && mouseOrTouchEvent.targetTouches.length >= 1) {
        offset.realX = mouseOrTouchEvent.targetTouches[0].pageX;
        offset.realY = mouseOrTouchEvent.targetTouches[0].pageY;
    } else {
        offset.realX = 0;
        offset.realY = 0;
    }

    var _x = (offset.realX - offset.left - offset.halfWidth) / offset.halfSquareWidthHeight * ccn_datetimepicker_dialPlateRadius;
    var _y = -((offset.realY - offset.top - offset.halfHeight) / offset.halfSquareWidthHeight * ccn_datetimepicker_dialPlateRadius);

    return {x: _x, y: _y};
}

function ccn_datetimepicker_PrevNextYear(isPrev) {
    ccn_datetimepicker_displayCacheDateTime.setFullYear(
        ccn_datetimepicker_displayCacheDateTime.getFullYear() + (isPrev ? -12 : 12));

    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_displayCacheDateTime);
    ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.year);
}

function ccn_datetimepicker_PrevNextMonth(isPrev) {
    ccn_datetimepicker_displayCacheDateTime.setFullYear(
        ccn_datetimepicker_displayCacheDateTime.getFullYear() + (isPrev ? -1 : 1));

    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_displayCacheDateTime);
    ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.month);
}

function ccn_datetimepicker_PrevNextDay(isPrev) {
    ccn_datetimepicker_displayCacheDateTime.setMonth(
        ccn_datetimepicker_displayCacheDateTime.getMonth() + (isPrev ? -1 : 1));

    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_displayCacheDateTime);
    ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.day);
}

function ccn_datetimepicker_ClickYear() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setFullYear(parseInt(ele.attr('data')));
    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_internalDateTime);

    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.year)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.month);
    else
        ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.year);
}

function ccn_datetimepicker_ClickMonth() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setFullYear(
        ccn_datetimepicker_displayCacheDateTime.getFullYear(),
        parseInt(ele.attr('data'))
    );
    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_internalDateTime);

    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.month)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.day);
    else
        ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.month);
}

function ccn_datetimepicker_ClickDay() {
    var ele = $(this);
    if (ele.attr('data') == '') return;

    ccn_datetimepicker_internalDateTime.setFullYear(
        ccn_datetimepicker_displayCacheDateTime.getFullYear(),
        ccn_datetimepicker_displayCacheDateTime.getMonth(),
        parseInt(ele.attr('data'))
    );
    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_internalDateTime);

    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.day)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.hour);
    else
        ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.day);
}


function ccn_datetimepicker_StartDragHour() { ccn_datetimepicker_enableHourDrag = true; }
function ccn_datetimepicker_DraggingHour(e) {
    if (!ccn_datetimepicker_enableHourDrag) return;

    var offset = ccn_datetimepicker_GetUniformedXY(e, $('#ccn-datetimepicker-panelHour'));
    var x = offset.x;
    var y = offset.y;

    var distance = Math.sqrt(x * x + y * y);
    var angle = Math.acos(x / distance);
    if (y < 0) angle = Math.PI * 2 - angle; // correct negative y axis angle

    angle += (ccn_datetimepicker_dialPlateHourResolution / 2); // correct offset
    if (angle > Math.PI * 2)
        angle -= Math.PI * 2;

    var number = Math.floor(angle / ccn_datetimepicker_dialPlateHourResolution);
    if (number >= 12) number = 11; // prevent unexpected result at the edge.
    number = (15 - number) % 12;
    if (distance < ccn_datetimepicker_dialPlateRadius * ccn_datetimepicker_dialPlateHourDistinguishPercent)
        number += 12;

    // judge
    if (ccn_datetimepicker_displayCacheDateTime.getHours() != number) {
        ccn_datetimepicker_displayCacheDateTime.setHours(number);
        ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.hour);
    }
    
    e.preventDefault();
}
function ccn_datetimepicker_StopDragHour() { 
    ccn_datetimepicker_enableHourDrag = false;

    ccn_datetimepicker_internalDateTime.setHours(ccn_datetimepicker_displayCacheDateTime.getHours());
    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_internalDateTime);

    if (ccn_datetimepicker_mode != ccn_datetimepicker_tabType.hour)
        ccn_datetimepicker_SwitchTab(ccn_datetimepicker_tabType.minute);
}


function ccn_datetimepicker_StartDragMinute() { ccn_datetimepicker_enableMinuteDrag = true; }
function ccn_datetimepicker_DraggingMinute(e) {
    if (!ccn_datetimepicker_enableMinuteDrag) return;

    var offset = ccn_datetimepicker_GetUniformedXY(e, $('#ccn-datetimepicker-panelMinute'));
    var x = offset.x;
    var y = offset.y;

    var distance = Math.sqrt(x * x + y * y);
    var angle = Math.acos(x / distance);
    if (y < 0) angle = Math.PI * 2 - angle; // correct negative y axis angle

    angle += (ccn_datetimepicker_dialPlateMinuteResolution / 2); // correct offset
    if (angle > Math.PI * 2)
        angle -= Math.PI * 2;

    var number = Math.floor(angle / ccn_datetimepicker_dialPlateMinuteResolution);
    if (number >= 60) number = 59; // prevent unexpected result at the edge.
    number = (75 - number) % 60;

    // judge
    if (ccn_datetimepicker_displayCacheDateTime.getMinutes() != number) {
        ccn_datetimepicker_displayCacheDateTime.setMinutes(number);
        ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.minute);
    }

    e.preventDefault();
}
function ccn_datetimepicker_StopDragMinute() { 
    ccn_datetimepicker_enableMinuteDrag = false;

    ccn_datetimepicker_internalDateTime.setMinutes(ccn_datetimepicker_displayCacheDateTime.getMinutes());
    ccn_datetimepicker_ClampDateTime(ccn_datetimepicker_internalDateTime);

    // no page need to go to
    // but we need refresh current page
    ccn_datetimepicker_RefreshDisplay(ccn_datetimepicker_tabType.minute);
}


function ccn_datetimepicker_ClampDateTime(dateObj) {
    if (dateObj < ccn_datetime_MIN_DATETIME)
        dateObj.setTime(ccn_datetime_MIN_DATETIME.getTime());
    if (dateObj >= ccn_datetime_MAX_DATETIME)
        dateObj.setTime(ccn_datetime_MAX_DATETIME.getTime());
}

// ========================================================== universal function

function ccn_datetimepicker_Set(pickerIndex, dt, isUTC, mode) {
    var ele = $('[datetimepicker=' + pickerIndex + ']');
    while(true) {
        if (mode < ccn_datetimepicker_tabType.year) break;
        ele.attr('datetimepicker-year', isUTC ? dt.getUTCFullYear() : dt.getFullYear());
        if (mode < ccn_datetimepicker_tabType.month) break;
        ele.attr('datetimepicker-month', (isUTC ? dt.getUTCMonth() : dt.getMonth()) + 1);
        if (mode < ccn_datetimepicker_tabType.day) break;
        ele.attr('datetimepicker-day', isUTC ? dt.getUTCDate() : dt.getDate());
        if (mode < ccn_datetimepicker_tabType.hour) break;
        ele.attr('datetimepicker-hour', isUTC ? dt.getUTCHours() : dt.getHours());
        if (mode < ccn_datetimepicker_tabType.minute) break;
        ele.attr('datetimepicker-minute', isUTC ? dt.getUTCMinutes() : dt.getMinutes());

        break;
    }

    if (typeof(ele.prop('funcs')) != 'undefined' && typeof(ele.prop('funcs').callback) == 'function')
        ele.prop('funcs').callback();
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
