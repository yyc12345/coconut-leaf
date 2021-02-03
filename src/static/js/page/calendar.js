var ccn_calendar_sharingListCache = [];
var ccn_calendar_sharingTargetListCache = [];
var ccn_calendar_sharedListCache = [];

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
    ccn_calendar_LoadCalendarBody();

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
});

function ccn_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBbody').append(ccn_template_calendarItem.render());
}

// ================== calendar


// ================== collection

function ccn_calendar_sharing_Refresh() {
    ccn_calendar_sharingListCache = new Array();

    var result = ccn_api_collection_getFullOwn();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_sharingListCache[result[index][0]] = result[index];
        }
    }

    // render
    $('#ccn-admin-userList').empty();

    var listDOM = $('#ccn-admin-userList');
    for(var index in ccn_admin_userListCache) {
        ccn_admin_userList_RenderItem(
            ccn_admin_userListCache[index],
            index,
            listDOM
        )
    }
}

function ccn_calendar_sharing_RenderItem() {
    
}

function ccn_calendar_sharingTarget_Refresh() {

}

function ccn_calendar_sharingTarget_RenderItem() {
    
}

function ccn_calendar_shared_Refresh() {

}
