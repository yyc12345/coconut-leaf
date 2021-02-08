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

    // bind event
    $('#ccn-calendar-collection-btnRefresh').click(ccn_calendar_collection_Refresh);

    $('#ccn-calendar-calendar-btnJump').click(ccn_calendar_calendar_Refresh);
    $('#ccn-calendar-calendar-btnToday').click(ccn_calendar_calendar_Today);
    $('#ccn-calendar-calendar-btnAdd').click(ccn_calendar_calendar_Add);
});

// ================== calendar

function ccn_calendar_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBody').append(ccn_template_calendarItem.render());
}

function ccn_calendar_calendar_Refresh() {
    gottenDateTime = ccn_datetimepicker_Get(1);
    gottenYear = gottenDateTime.getFullYear();
    gottenMonth = gottenDateTime.getMonth() + 1;
}

function ccn_calendar_calendar_Render() {

}

function ccn_calendar_calendar_AnalyseEvent() {
    
}

function ccn_calendar_calendar_Today() {
    var nowtime = new Date();
    ccn_datetimepicker_Set(1, nowtime);
    ccn_calendar_calendar_Refresh();
}

function ccn_calendar_calendar_Add() {
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
