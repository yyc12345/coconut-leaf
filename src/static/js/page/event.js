// if it is undefined, current mode is add
// or it is the detail data gotten from api
var ccn_event_editingEvent = undefined;
var ccn_event_collectionCache = [];

$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.event;

    // template process
    ccn_template_Load();

    // nav process
    ccn_headerNav_Insert();
    ccn_headerNav_BindEvents();
    ccn_headerNav_LoggedRefresh();

    // messagebox process
    ccn_messagebox_Insert();
    ccn_messagebox_BindEvent();

    // apply i18n
    ccn_i18n_LoadLanguage();
    ccn_i18n_ApplyLanguage();
    
    // bind event
    $('input[type=radio][name=loop-method]').click(ccn_event_RefreshRadioDiaplay);
    $('input[type=radio][name=loop-end]').click(ccn_event_RefreshRadioDiaplay);
    $('.datetimepicker-year[datetimepicker=1],.datetimepicker-month[datetimepicker=1],.datetimepicker-day[datetimepicker=1]').bind(
        'input propertychange',
        ccn_event_RefreshLoopMonthType
    );

    $('#ccn-event-btnSubmit').click(ccn_event_btnSubmit);
    $('#ccn-event-btnCancel').click(ccn_event_btnCancel);
    $('#ccn-event-btnSpot').click(ccn_event_btnSpot);
    $('#ccn-event-btnFullDay').click(ccn_event_btnFullDay);

    // init form
    ccn_event_Init();

    // refresh once
    ccn_event_RefreshRadioDiaplay();
    ccn_event_RefreshLoopMonthType();
});


function ccn_event_Init() {
    // we need init some elements first

    // we need all radio and checkbox's checked is false, not undefined.
    $('input[type=radio]').prop("checked", false);
    $('input[type=checkbox]').prop("checked", false);

    // init span picker
    $('.spanpicker').attr('max', 100)
    .attr('min', 1)
    .attr('step', 1)
    .val(1);

    // now, init 3 datetimepicker
    ccn_datetimepicker_Init();

    // in there, we need get uuid from meta
    var uuid = $('meta[name=uuid]').attr('content');
    if (uuid != "")
        ccn_event_editingEvent = ccn_api_calendar_getDetail(uuid);
    // if ccn_event_editingEvent is undefined, init following content with add mode
    // otherwise, init as update mode
    var isAdd = typeof(ccn_event_editingEvent) == 'undefined';

    // init title and description
    $('#ccn-event-inputTitle').val(
        isAdd ? '' : ccn_event_editingEvent[2]
    );
    $('#ccn-event-inputDescription').val(
        isAdd ? '' : ccn_event_editingEvent[3]
    );

    // init collection picker, first we need query data
    // and render it
    var collectionDOM = $('#ccn-event-inputCollection');
    collectionDOM.empty();
    ccn_event_collectionCache = new Array();
    var result = ccn_api_collection_getFullOwn();
    if (typeof(result) != 'undefined') {
        var renderdata = {
            val: undefined,
            name: undefined
        }

        for (var index in result) {
            var item = result[index];
            ccn_event_collectionCache.push(item[0])
            renderdata.val = item[0];
            renderdata.name = item[1];
            collectionDOM.append(
                ccn_template_optionItem.render(renderdata)
            );
        }
    }
    // in add mode, set as -1, otherwise try to match original data
    // indexOf will return -1 if no matched item
    collectionDOM.val(isAdd ? '' : ccn_event_editingEvent[1]);

    // init start and end datetime
    if (isAdd) {
        // in add mode, init 2 datetime picker as close hours based time.
        var currentDateTime = new Date();
        currentDateTime.setMilliseconds(0);
        currentDateTime.setSeconds(0);
        currentDateTime.setMinutes(0);
        ccn_datetimepicker_Set(1, currentDateTime, false);
    
        // time span is 2 hours
        currentDateTime.setHours(currentDateTime.getHours() + 2);
        ccn_datetimepicker_Set(2, currentDateTime, false);
    } else {
        // in update mode, match it with original data
        var originalDateTime = new Date((ccn_event_editingEvent[5] + ccn_event_editingEvent[7]) * 60000);
        ccn_datetimepicker_Set(1, originalDateTime, true);

        originalDateTime = new Date((ccn_event_editingEvent[6] + ccn_event_editingEvent[7]) * 60000);
        ccn_datetimepicker_Set(2, originalDateTime, true);
    }

    // setup timezone here
    // to prevent some error
    // because following isAdd will change its meaning
    $('#ccn-event-timezone-radioKeep').prop('checked', true);   // give a default value
    var nowtime = new Date();
    SmarterShowHide(
        (!isAdd) && (-nowtime.getTimezoneOffset()) != ccn_event_editingEvent[7],
        $('#ccn-event-boxTimezone')
    );

    // ========================
    // now we need resolve loop rules and set related data
    if (!isAdd) {
        data = ccn_datetime_ResolveLoopRules4UI(ccn_event_editingEvent[8]);
        if (typeof(data) == 'undefined') isAdd = true;  // init as add
    }

    // give some value with a default value
    $('#ccn-event-loopMonth-radioA').prop('checked', true);
    $('#ccn-event-loopWeek-check' + (nowtime.getWeekday() + 1)).prop('checked', true);
    $('#ccn-event-strictMode-radioStrict').prop('checked', true);

    // real process
    if (isAdd) {
        $('#ccn-event-radioLoopNever').prop('checked', true);
    } else {
        switch(data[0][0]) {
            case 0:
                $('#ccn-event-radioLoopYear').prop('checked', true);
                $('#ccn-event-loopYear-inputSpan').val(data[0][2]);
                if (data[0][1]) $('#ccn-event-strictMode-radioStrict').prop('checked', true);
                else $('#ccn-event-strictMode-radioRough').prop('checked', true);
                break;
            case 1:
                $('#ccn-event-radioLoopMonth').prop('checked', true);
                $('#ccn-event-loopMonth-inputSpan').val(data[0][3]);
                $('#ccn-event-loopMonth-radio' + data[0][2]).prop('checked', true);
                if (data[0][1]) $('#ccn-event-strictMode-radioStrict').prop('checked', true);
                else $('#ccn-event-strictMode-radioRough').prop('checked', true);
                break;
            case 2:
                $('#ccn-event-radioLoopWeek').prop('checked', true);
                $('#ccn-event-loopWeek-inputSpan').val(data[0][8]);
                for(var i = 1; i <= 7; i++) {
                    $('#ccn-event-loopWeek-check' + i).prop('checked', data[0][i]);
                }
                break;
            case 3:
                $('#ccn-event-radioLoopDay').prop('checked', true);
                $('#ccn-event-loopDay-inputSpan').val(data[0][1]);
                break;
        }
    }

    // give some item a default value
    ccn_datetimepicker_Set(3, nowtime, false);

    if (isAdd) {
        $('#ccn-event-loopStop-radioForever').prop('checked', true);
    } else {
        switch(data[1][0]) {
            case 0:
                $('#ccn-event-loopStop-radioForever').prop('checked', true);
                break;
            case 1:
                $('#ccn-event-loopStop-radioDateTime').prop('checked', true);
                var stopDatetime = new Date((data[1][1] + ccn_event_editingEvent[7]) * 60000);
                ccn_datetimepicker_Set(3, stopDatetime, true);
                break;
            case 2:
                $('#ccn-event-loopStop-radioTimes').prop('checked', true);
                $('#ccn-event-loopStop-inputTimes').val(data[1][1]);
                break;
        }
    }

}

// refresh some ui element according to form options
function ccn_event_RefreshRadioDiaplay() {
    // loop method
    // note: no loop control loop stop's display
    // note: year and month loop also control strict mode display
    SmarterShowHide(!$('#ccn-event-radioLoopNever').prop('checked'), $('#ccn-event-boxLoopStop'));
    
    SmarterShowHide($('#ccn-event-radioLoopDay').prop('checked'), $('#ccn-event-boxLoopDay'));
    SmarterShowHide($('#ccn-event-radioLoopWeek').prop('checked'), $('#ccn-event-boxLoopWeek'));
    SmarterShowHide($('#ccn-event-radioLoopMonth').prop('checked'), $('#ccn-event-boxLoopMonth'));
    SmarterShowHide($('#ccn-event-radioLoopYear').prop('checked'), $('#ccn-event-boxLoopYear'));

    SmarterShowHide(
        $('#ccn-event-radioLoopMonth').prop('checked') || $('#ccn-event-radioLoopYear').prop('checked'), 
        $('#ccn-event-boxStrictMode')
    );

    // loop stop
    SmarterShowHide($('#ccn-event-loopStop-radioForever').prop('checked'), undefined);
    SmarterShowHide($('#ccn-event-loopStop-radioDateTime').prop('checked'), $('#ccn-event-boxLoopStopDateTime'));
    SmarterShowHide($('#ccn-event-loopStop-radioTimes').prop('checked'), $('#ccn-event-boxLoopStopTimes'));

}

function ccn_event_RefreshLoopMonthType() {
    var picker = ccn_datetimepicker_Get(1, false);
    var data = ccn_datetime_GetDayInMonth(picker.getFullYear(), picker.getMonth() + 1, picker.getDate());

    $('#ccn-event-loopMonth-textA').text($.i18n.prop('ccn-i18n-event-loopWeek-optionA').format(data[0]));
    $('#ccn-event-loopMonth-textB').text($.i18n.prop('ccn-i18n-event-loopWeek-optionB').format(data[1]));
    $('#ccn-event-loopMonth-textC').text($.i18n.prop('ccn-i18n-event-loopWeek-optionC').format(data[2], data[3] + 1));
    $('#ccn-event-loopMonth-textD').text($.i18n.prop('ccn-i18n-event-loopWeek-optionD').format(data[4], data[5] + 1));
}

// return undefined to indicate an error
// or
// [belongTo, title, description, eventDateTimeStart, eventDateTimeEnd, timezoneOffset, loopRules]
function ccn_event_GetForm() {
    // basic
    var title = $('#ccn-event-inputTitle').val();
    if (title == '') return undefined;
    var description = $('#ccn-event-inputDescription').val();
    if (description == '') return undefined;
    var belongTo = $('#ccn-event-inputCollection').val();
    if (belongTo == null) return undefined; // if no selected item, val return null, not undefined

    var isAdd = typeof(ccn_event_editingEvent) == 'undefined';
    var keepTimezone = $('#ccn-event-timezone-radioKeep').prop('checked');
    var isStrict = $('#ccn-event-strictMode-radioStrict').prop('checked');

    // time
    var eventDateTimeStart = undefined;
    var eventDateTimeEnd = undefined;
    var timezoneOffset = undefined;
    if ((!isAdd) && (!keepTimezone)) {
        // get datetime as utc, then minus original timezone to get unix timestamp
        timezoneOffset = ccn_event_editingEvent[7]; // keep timezone
        eventDateTimeStart = Math.floor(ccn_datetimepicker_Get(1, true).getTime() / 60000) - timezoneOffset;
        eventDateTimeEnd = Math.floor(ccn_datetimepicker_Get(2, true).getTime() / 60000) - timezoneOffset;
    } else {
        // use my timezone, resolve presented data as my local time
        var cache = ccn_datetimepicker_Get(1, false);
        timezoneOffset = -cache.getTimezoneOffset();
        eventDateTimeStart = Math.floor(cache.getTime() / 60000);
        eventDateTimeEnd = Math.floor(ccn_datetimepicker_Get(2, false).getTime() / 60000);
    }

    // loopRules
    var loopRules = undefined;
    if ($('#ccn-event-radioLoopNever').prop('checked')) {
        loopRules = "";
    } else if ($('#ccn-event-radioLoopDay').prop('checked')) {
        loopRules = "D{0}".format($('#ccn-event-loopDay-inputSpan').val());
    } else if ($('#ccn-event-radioLoopWeek').prop('checked')) {
        var cache = ""
        for(var i = 1; i < 8; i++)
            cache += $('#ccn-event-loopWeek-check' + i).prop('checked') ? 'T' : 'F';
        loopRules = 'W{0}{1}'.format(
            cache,
            $('#ccn-event-loopWeek-inputSpan').val()
        );
    } else if ($('#ccn-event-radioLoopMonth').prop('checked')) {
        var cache = undefined;
        if ($('#ccn-event-loopMonth-radioA').prop('checked')) cache='A';
        else if ($('#ccn-event-loopMonth-radioB').prop('checked')) cache='B';
        else if ($('#ccn-event-loopMonth-radioC').prop('checked')) cache='C';
        else if ($('#ccn-event-loopMonth-radioD').prop('checked')) cache='D';
        else return undefined;

        loopRules = "M{0}{1}{2}".format(
            isStrict ? "S" : "R",
            cache,
            $('#ccn-event-loopMonth-inputSpan').val()
        );
    } else if ($('#ccn-event-radioLoopYear').prop('checked')) {
        loopRules = "Y{0}{1}".format(
            isStrict ? "S" : "R",
            $('#ccn-event-loopYear-inputSpan').val()
        );
    }

    // no need to process stop if this is not a loop event
    if (loopRules != "") {
        loopRules += '-';
        if ($('#ccn-event-loopStop-radioForever').prop('checked')) {
            loopRules += 'F';
        } else if ($('#ccn-event-loopStop-radioDateTime').prop('checked')) {
            var timestamp = undefined;
            if ((!isAdd) && (!keepTimezone)) {
                // keep timezone
                var cache = ccn_datetimepicker_Get(3, true);
                cache.setUTCHours(23);
                cache.setUTCMinutes(59);
                timestamp = Math.floor(cache.getTime() / 60000) - timezoneOffset;
            } else {
                // use my timezone
                timestamp = Math.floor(ccn_datetimepicker_Get(3, false).getTime() / 60000);
            }
            
            loopRules += 'D{0}'.format(timestamp);
        } else if ($('#ccn-event-loopStop-radioTimes').prop('checked')) {
            loopRules += 'T{0}'.format($('#ccn-event-loopStop-inputTimes').val());
        }
    }

    return [belongTo, title, description, eventDateTimeStart, eventDateTimeEnd, timezoneOffset, loopRules];
}

function ccn_event_btnSpot() {
    var datetime = ccn_datetimepicker_Get(1, false);
    datetime.setMinutes(datetime.getMinutes() + 1);
    ccn_datetimepicker_Set(2, datetime, false);
}

function ccn_event_btnFullDay() {
    var datetime = ccn_datetimepicker_Get(1, false);
    datetime.setMinutes(0);
    datetime.setHours(0);
    ccn_datetimepicker_Set(1, datetime, false);
    datetime.setMinutes(59);
    datetime.setHours(23);
    ccn_datetimepicker_Set(2, datetime, false);
}

function ccn_event_btnCancel() {
    window.location.href = '/web/calendar';
}

function ccn_event_btnSubmit() {
    var submitData = ccn_event_GetForm();
    if (typeof(submitData) == 'undefined') {
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-form"));
        return;
    }

    var isAdd = typeof(ccn_event_editingEvent) == 'undefined';
    if (isAdd) {
        var result = ccn_api_calendar_add(
            submitData[0],
            submitData[1],
            submitData[2],
            submitData[3],
            submitData[4],
            submitData[6],
            submitData[5]
        );
        if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-add"));
        else window.location.href = '/web/calendar';
    } else {
        var result = ccn_api_calendar_update(
            ccn_event_editingEvent[0],
            ccn_event_editingEvent[1] == submitData[0] ? undefined : submitData[0],
            ccn_event_editingEvent[2] == submitData[1] ? undefined : submitData[1],
            ccn_event_editingEvent[3] == submitData[2] ? undefined : submitData[2],
            ccn_event_editingEvent[5] == submitData[3] ? undefined : submitData[3],
            ccn_event_editingEvent[6] == submitData[4] ? undefined : submitData[4],
            ccn_event_editingEvent[8] == submitData[6] ? undefined : submitData[6],
            ccn_event_editingEvent[7] == submitData[5] ? undefined : submitData[5],
            ccn_event_editingEvent[4]
        );
        if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-update"));
        else window.location.href = '/web/calendar';
    }
}

