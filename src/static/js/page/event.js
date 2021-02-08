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
    collectionDOM.val(isAdd ? '' : ccn_calendar_eventModal_editing[1]);

    // init start and end datetime
    if (isAdd) {
        // in add mode, init 2 datetime picker as close hours based time.
        var currentDateTime = new Date();
        currentDateTime.setMilliseconds(0);
        currentDateTime.setSeconds(0);
        currentDateTime.setMinutes(0);
        ccn_datetimepicker_Set(1, currentDateTime);
    
        // time span is 2 hours
        currentDateTime.setHours(currentDateTime.getHours() + 2);
        ccn_datetimepicker_Set(2, currentDateTime);
    } else {
        // in update mode, match it with original data
        var originalDateTime = new Date(ccn_event_editingEvent[5] * 60000);
        ccn_datetimepicker_Set(1, originalDateTime);

        originalDateTime = new Date(ccn_event_editingEvent[6] * 60000);
        ccn_datetimepicker_Set(2, originalDateTime);
    }

    // setup timezone here
    // to prevent some error
    // because following isAdd will change its meaning
    $('#ccn-event-timezone-radioKeep').prop('checked', true);   // give a default value
    var nowtime = new Date();
    SmarterShowHide(
        (!isAdd) && nowtime.getTimezoneOffset() != ccn_event_editingEvent[7],
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
    var weekDate = undefined;
    if (isAdd) weekDate = nowtime;
    else weekDate = new Date(ccn_event_editingEvent[5] * 60000);
    $('#ccn-event-loopWeek-check' + (weekDate.getDay() + 1)).prop('checked', true);

    // real process
    if (isAdd) $('#ccn-event-radioLoopNever').prop('checked', true);
    else {
        switch(data[0][0]) {
            case 0:
                $('#ccn-event-radioLoopYear').prop('checked', true);
                $('#ccn-event-loopYear-inputSpan').val(data[0][2]);
                break;
            case 1:
                $('#ccn-event-radioLoopMonth').prop('checked', true);
                $('#ccn-event-loopMonth-inputSpan').val(data[0][3]);
                $('#ccn-event-loopMonth-radio' + data[0][2]).prop('checked', true);
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

    if (isAdd) {
        $('#ccn-event-loopStop-radioForever').prop('checked', true);
        ccn_datetimepicker_Set(3, nowtime);
    } else {
        switch(data[1][0]) {
            case 0:
                $('#ccn-event-loopStop-radioForever').prop('checked', true);
                break;
            case 1:
                $('#ccn-event-loopStop-radioDateTime').prop('checked', true);
                var stopDatetime = new Date(data[1][1] * 60000);
                ccn_datetimepicker_Set(3, stopDatetime);
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

}

// return undefined to indicate an error
function ccn_event_Get() {

}

