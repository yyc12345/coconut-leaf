// 2 list which will store sharing and shared collection's display mode.
// key is uuid, value is bool
var ccn_calendar_owned_displayCache = [];
var ccn_calendar_shared_displayCache = [];

// modal editing object.
// undefined mean add
// not undefined mean update(a copy of calendar event)
var ccn_calendar_eventModal_editing = undefined;
var ccn_calendar_eventModal_collectionCache = [];
var ccn_calendar_calendar_listCache = [];
var ccn_calendar_calendar_displayCache = [];
var ccn_calendar_calendar_displayDateTime = 0;

$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.calendar;
        
    // template process
    ccn_template_Load();
    
    // nav process
    ccn_headerNav_Insert();
    ccn_headerNav_BindEvents();
    ccn_headerNav_LoggedRefresh();

    // messagebox process
    ccn_messagebox_Insert();
    ccn_messagebox_BindEvent();
    
    // process calendar it self
    ccn_calendar_calendar_LoadCalendarBody();

    // init datetimepicker
    ccn_datetimepicker_Init();

    // bind tab control switcher and set current tab
    $("#tabcontrol-tab-1-1").click(function(){
        ccn_tabcontrol_SwitchTab(1, 1);
    });
    $("#tabcontrol-tab-1-2").click(function(){
        ccn_tabcontrol_SwitchTab(1, 2);
    });
    $("#tabcontrol-tab-1-3").click(function(){
        ccn_tabcontrol_SwitchTab(1, 3);
    });
    ccn_tabcontrol_SwitchTab(1, 1);

    // apply i18n
    ccn_i18n_LoadLanguage();
    ccn_i18n_ApplyLanguage();

    //refresh once
    ccn_calendar_collection_Refresh();
    ccn_calendar_calendar_Refresh();
    ccn_calendar_calendar_Analyse();
    ccn_calendar_calendar_Render();

    // bind event
    $('#ccn-calendar-collection-btnRefresh').click(ccn_calendar_collection_Refresh);

    $('#ccn-calendar-calendar-btnJump').click(ccn_calendar_calendar_btnRefresh);
    $('#ccn-calendar-calendar-btnToday').click(ccn_calendar_calendar_btnToday);
    $('#ccn-calendar-calendar-btnAdd').click(ccn_calendar_calendar_btnAdd);
});

// ================== calendar

function ccn_calendar_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBody').append(ccn_template_calendarItem.render());
}

// this function only refresh cache list
function ccn_calendar_calendar_Refresh() {
    var gottenDateTime = ccn_datetimepicker_Get(1, false);
    var gottenYear = gottenDateTime.getFullYear();
    var gottenMonth = gottenDateTime.getMonth() + 1;
    // don't need to set anything, because its default value is enough to use.

    var gottenWeek = ccn_datetime_DayOfWeek(gottenYear, gottenMonth, 1);
    var startTimestamp = Math.floor(gottenDateTime.getTime() / 60000) - gottenWeek * ccn_datetime_DAY1_SPAN;
    var endTimestamp = startTimestamp + ccn_datetime_DAY1_SPAN * 6 * 7 - 1;

    ccn_calendar_calendar_listCache = new Array();
    var result = ccn_api_calendar_getFull(startTimestamp, endTimestamp);
    if (typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_calendar_listCache[result[index][0]] = result[index];
        }
    }
}

// this function take responsibility to analyse event
// call datetime function to resolve loop event
// and split event if some event cross 2+ days
function ccn_calendar_calendar_Analyse() {
    // first, we need construct ccn_calendar_calendar_displayCache
    ccn_calendar_calendar_displayCache = new Array();
    var gottenDateTime = ccn_datetimepicker_Get(1, false);
    var gottenYear = gottenDateTime.getFullYear();
    var gottenMonth = gottenDateTime.getMonth() + 1;
    var gottenWeek = ccn_datetime_DayOfWeek(gottenYear, gottenMonth, 1);
    var startTimestamp = Math.floor(gottenDateTime.getTime() / 60000) - gottenWeek * ccn_datetime_DAY1_SPAN;
    var endTimestamp = startTimestamp + ccn_datetime_DAY1_SPAN * 6 * 7 - 1;
    gottenDateTime.setTime(startTimestamp * 60000);
    for(var index = 0; index < 6 * 7; index++) {
        ccn_calendar_calendar_displayCache.push({
            month: gottenDateTime.getMonth() + 1,
            day: gottenDateTime.getDate(),
            dayOfWeek: gottenDateTime.getWeekday() + 1,
            subcalendar: "       -",
            events: new Array()
        });
        gottenDateTime.setTime(gottenDateTime.getTime() + ccn_datetime_DAY1_SPAN * 60000);
    }

    var mytimezone = -(new Date().getTimezoneOffset());
    // then analyse each event
    for(var index in ccn_calendar_calendar_listCache) {
        var item = ccn_calendar_calendar_listCache[index];
        
        var minStartTimestamp = startTimestamp - (item[6] - item[5]);
        var result = ccn_datetime_ResolveLoopRules4Event(
            item[8],
            item[9] < minStartTimestamp ? minStartTimestamp : item[9],
            Math.min(item[10], endTimestamp),
            item[5],
            item[6],
            item[7],
            startTimestamp
        );
        if(typeof(result) != 'undefined') {
            for(var i in result) {
                var it = result[i];
                // try get event belong to which cell
                var eventDateTime = new Date(it[0] * 60000);
                var count = Math.floor((it[0] - startTimestamp) / ccn_datetime_DAY1_SPAN);
                var exitFlag = false;
                // then split event
                while(count < 6 * 7) {
                    var eventItem = {
                        uuid: item[0],
                        belongTo: item[1],
                        title: item[2],
                        description: item[3],
                        isVisible: true,
                        isLocked: typeof(ccn_calendar_owned_displayCache[item[0]]) != 'undefined',
                        loopText: " ",  // todo: finish this
                        timezoneWarning: mytimezone != item[7],
                        start: eventDateTime.toLocaleTimeString(),
                        end: undefined  // filled in follwing code
                    }
                    eventDateTime.setHours(23, 59, 0, 0);
                    if (Math.floor(eventDateTime.getTime() / 60000) > it[1]) {
                        exitFlag = true;
                        eventDateTime.setTime(it[1] * 60000);
                    }
                    eventItem.end = eventDateTime.toLocaleTimeString();
                    ccn_calendar_calendar_displayCache[count].events.push(eventItem);
                    if (exitFlag) break;
                    else eventDateTime.setMinutes(eventDateTime.getMinutes() + 1, 0, 0);
                    count++;
                }
            }
        }
    }

}

// just use produced ccn_calendar_calendar_displayCache
// to re-generate ui
function ccn_calendar_calendar_Render() {
    // all data has been alanysed, feeback to calendar body.
    var counter = 0;
    for(var i = 0; i < 6; i++) {
        for(var j = 0; j < 7; j++) {
            var item = ccn_calendar_calendar_displayCache[counter];
            $('#ccn-calendarItem-title-' + i + '-' + j).text(item.day);
            $('#ccn-calendarItem-desc-' + i + '-' + j).text(item.subcalendar);
            $('#ccn-calendarItem-task-' + i + '-' + j).text(item.events.length.toString());
            counter++;
        }
    }

    // todo: add / migrate subcalendar feature here

    // analyse visible data
    for(var i in ccn_calendar_calendar_displayCache) {
        for(var j in ccn_calendar_calendar_displayCache[i].events) {
            var gottenOwnedVisible = ccn_calendar_owned_displayCache[
                ccn_calendar_calendar_displayCache[i].events[j].belongTo
            ];
            if (typeof(gottenOwnedVisible) == 'undefined') gottenOwnedVisible = false;
            var gottenSharedVisible = ccn_calendar_shared_displayCache[
                ccn_calendar_calendar_displayCache[i].events[j].belongTo
            ];
            if (typeof(gottenSharedVisible) == 'undefined') gottenSharedVisible = false;

            ccn_calendar_calendar_displayCache[i].events[j].isVisible = gottenOwnedVisible || gottenSharedVisible;
        }
    }

    // just render them
    var listDOM = $('#ccn-calendar-scheduleList');
    listDOM.empty();
    listDOM.append(ccn_template_scheduleItem.render({renderdata: ccn_calendar_calendar_displayCache}));
    ccn_i18n_ApplyLanguage2Content(listDOM);
}

function ccn_calendar_calendar_btnRefresh() {
    ccn_calendar_calendar_Refresh();
    ccn_calendar_calendar_Analyse();
    ccn_calendar_calendar_Render();
}

function ccn_calendar_calendar_btnToday() {
    var nowtime = new Date();
    ccn_datetimepicker_Set(1, nowtime, false);
    ccn_calendar_calendar_Refresh();
    ccn_calendar_calendar_Analyse();
    ccn_calendar_calendar_Render();
}

function ccn_calendar_calendar_btnAdd() {
    window.location.href = '/web/eventAdd';
}

function ccn_calendar_calendar_ItemUpdate() {
    var uuid = $(this).attr("uuid");
    window.location.href = '/web/eventUpdate/' + uuid;
}

// ============================= collection

function ccn_calendar_collection_Refresh() {
    ccn_calendar_owned_displayCache = new Array();
    ccn_calendar_shared_displayCache = new Array();

    // render shared
    var result = ccn_api_collection_getShared();
    var listDOM = $('#ccn-calendar-sharedList');
    listDOM.empty();
    var renderdata = {
        uuid: undefined,
        name: undefined,
        username: undefined
    }
    if (typeof(result) != 'undefined') {
        for(var index in result) {
            var item = result[index];
            renderdata.uuid = item[0];
            renderdata.name = item[1];
            renderdata.username = item[2];
    
            listDOM.append(ccn_template_displaySharedItem.render(renderdata));
    
            // change display
            var uuid = renderdata.uuid;
            ccn_calendar_shared_ChangeDisplayMode(uuid, true);

            // push into display list
            ccn_calendar_shared_displayCache[uuid] = true;
    
            // bind event
            $('#ccn-displaySharedItem-btnHide-' + uuid).click(ccn_calendar_shared_ItemSwitchDisplay);
            $('#ccn-displaySharedItem-btnShow-' + uuid).click(ccn_calendar_shared_ItemSwitchDisplay);
        }
    }

    ccn_i18n_ApplyLanguage2Content(listDOM);

    // render owned
    result = ccn_api_collection_getFullOwn();
    listDOM = $('#ccn-calendar-ownedList');
    listDOM.empty();
    renderdata = {
        uuid: undefined,
        name: undefined
    }
    if (typeof(result) != 'undefined') {
        for(var index in result) {
            var item = result[index];
            renderdata.uuid = item[0];
            renderdata.name = item[1];

            // render
            listDOM.append(ccn_template_displayOwnedItem.render(renderdata));

            // set mode
            var uuid = renderdata.uuid;
            ccn_calendar_owned_ChangeDisplayMode(uuid, true);

            // push into display list
            ccn_calendar_owned_displayCache[uuid] = true;

            // bind event
            $('#ccn-displayOwnedItem-btnHide-' + uuid).click(ccn_calendar_owned_ItemSwitchDisplay);
            $('#ccn-displayOwnedItem-btnShow-' + uuid).click(ccn_calendar_owned_ItemSwitchDisplay);
        }
    }

}

function ccn_calendar_owned_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_owned_displayCache[uuid] = !(ccn_calendar_owned_displayCache[uuid]);
    ccn_calendar_owned_ChangeDisplayMode(uuid, ccn_calendar_owned_displayCache[uuid]);
}

function ccn_calendar_shared_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_shared_displayCache[uuid] = !(ccn_calendar_shared_displayCache[uuid]);
    ccn_calendar_shared_ChangeDisplayMode(uuid, ccn_calendar_shared_displayCache[uuid]);
}

function ccn_calendar_shared_ChangeDisplayMode(uuid, isShow) {
    if (isShow) {
        $('#ccn-displaySharedItem-btnHide-' + uuid).show();
        $('#ccn-displaySharedItem-btnShow-' + uuid).hide();
    } else {
        $('#ccn-displaySharedItem-btnHide-' + uuid).hide();
        $('#ccn-displaySharedItem-btnShow-' + uuid).show();
    }
}

function ccn_calendar_owned_ChangeDisplayMode(uuid, isShow) {
    if (isShow) {
        $('#ccn-displayOwnedItem-btnHide-' + uuid).show();
        $('#ccn-displayOwnedItem-btnShow-' + uuid).hide();
    } else {
        $('#ccn-displayOwnedItem-btnHide-' + uuid).hide();
        $('#ccn-displayOwnedItem-btnShow-' + uuid).show();
    }
}
