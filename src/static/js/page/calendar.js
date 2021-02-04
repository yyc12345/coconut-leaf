// 3 used cache list
var ccn_calendar_sharingListCache = [];
var ccn_calendar_sharingTargetListCache = [];
var ccn_calendar_sharedListCache = [];

// current editing sharing collection
var ccn_calendar_editingSharing = undefined; // the uuid of owned collection

// 2 list which will store sharing and shared collection's display mode.
// key is uuid, value is bool
var ccn_calendar_sharing_displayCache = [];
var ccn_calendar_shared_displayCache = [];

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

    // bind event
    $('#ccn-calendar-shared-btnRefresh').click(ccn_calendar_shared_Refresh);
    $('#ccn-calendar-sharing-btnAdd').click(ccn_calendar_sharingList_Add);
    $('#ccn-calendar-sharing-btnRefresh').click(ccn_calendar_sharing_Refresh);
    $('#ccn-calendar-sharingTarget-btnAdd').click(ccn_calendar_sharingTargetList_Add);
    $('#ccn-calendar-sharingTarget-btnRefresh').click(ccn_calendar_sharingTarget_Refresh);
});

// ================== calendar

function ccn_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBbody').append(ccn_template_calendarItem.render());
}

// ================== collection

function ccn_calendar_sharing_Refresh() {
    ccn_calendar_sharingListCache = new Array();
    ccn_calendar_sharing_displayCache = new Array();

    var result = ccn_api_collection_getFullOwn();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_sharingListCache[result[index][0]] = result[index];
            ccn_calendar_sharing_displayCache[result[index][0]] = true;
        }
    }

    // render
    $('#ccn-calendar-sharingList').empty();

    var listDOM = $('#ccn-calendar-sharingList');
    for(var index in ccn_calendar_sharingListCache) {
        ccn_admin_userList_RenderItem(
            ccn_calendar_sharingListCache[index],
            listDOM
        )
    }
}

function ccn_calendar_sharing_RenderItem(item, listDOM) {
    var renderdata = {
        uuid: item[0],
        name: item[1]
    }

    // render
    listDOM.append(ccn_template_sharingItem.render(renderdata));

    // set mode
    var uuid = renderdata.uuid;
    ccn_calendar_sharing_ChangeDisplayMode(uuid, true, false);

    // bind event
    $('#ccn-calendar-sharingItem-btnEdit-' + uuid).click(ccn_calendar_sharingList_ItemEdit);
    $('#ccn-calendar-sharingItem-btnDelete-' + uuid).click(ccn_calendar_sharingList_ItemDelete);
    $('#ccn-calendar-sharingItem-btnShare-' + uuid).click(ccn_calendar_sharingList_ItemShare);
    $('#ccn-calendar-sharingItem-btnHide-' + uuid).click(ccn_calendar_sharingList_ItemSwitchDisplay);
    $('#ccn-calendar-sharingItem-btnShow-' + uuid).click(ccn_calendar_sharingList_ItemSwitchDisplay);
    $('#ccn-calendar-sharingItem-btnUpdate-' + uuid).click(ccn_calendar_sharingList_ItemUpdate);
    $('#ccn-calendar-sharingItem-btnCancelUpdate-' + uuid).click(ccn_calendar_sharingList_ItemCancelUpdate);
    
}

function ccn_calendar_sharing_ChangeDisplayMode(uuid, isShow, isEdit) {
    if (typeof(isShow) != 'undefined') {
        if (isShow) {
            $('#ccn-calendar-sharingItem-btnHide-' + uuid).show();
            $('#ccn-calendar-sharingItem-btnShow-' + uuid).hide();
        } else {
            $('#ccn-calendar-sharingItem-btnHide-' + uuid).hide();
            $('#ccn-calendar-sharingItem-btnShow-' + uuid).show();
        }
    }

    if (typeof(isEdit) != 'undefined') {
        if (isEdit) {
            $('#ccn-calendar-sharingItem-btnEdit-' + uuid).hide();
            $('#ccn-calendar-sharingItem-btnShare-' + uuid).hide();
            $('#ccn-calendar-sharingItem-btnDelete-' + uuid).hide();

            $('#ccn-calendar-sharingItem-btnUpdate-' + uuid).show();
            $('#ccn-calendar-sharingItem-btnCancelUpdate-' + uuid).show();

            $('#ccn-admin-userItem-textName-' + uuid).hide();
            $('#ccn-admin-userItem-boxName-' + uuid).show();
        } else {
            $('#ccn-calendar-sharingItem-btnEdit-' + uuid).show();
            $('#ccn-calendar-sharingItem-btnShare-' + uuid).show();
            $('#ccn-calendar-sharingItem-btnDelete-' + uuid).show();

            $('#ccn-calendar-sharingItem-btnUpdate-' + uuid).hide();
            $('#ccn-calendar-sharingItem-btnCancelUpdate-' + uuid).hide();

            $('#ccn-admin-userItem-textName-' + uuid).show();
            $('#ccn-admin-userItem-boxName-' + uuid).hide();
        }
    }
}



function ccn_calendar_sharingTarget_Refresh() {
    ccn_calendar_sharingTargetListCache = new Array();

    if (typeof(ccn_calendar_editingSharing) != 'undefined') {
        var result = ccn_api_collection_getSharing(ccn_calendar_editingSharing);
        if (typeof(result) != 'undefined') {
            for(var index in result) {
                ccn_calendar_sharingTargetListCache[index] = result[index];
                // also, sharingTarget don't have uuid, use index instead
            }
        }

        // update editing text
        $('#ccn-calendar-sharing-sharingEditing').text(ccn_calendar_sharingListCache[uuid][1]);
    }

    var listDOM = $('#ccn-calendar-sharingTargetList');
    listDOM.empty();
    for(var index in ccn_admin_userListCache) {
        ccn_admin_userList_RenderItem(
            ccn_calendar_sharingTargetListCache[index],
            index,
            listDOM
        )
    }
}

function ccn_calendar_sharingTarget_RenderItem(item, index, listDOM) {
    var renderdata = {
        uuid: index,
        username: item
    }

    // render
    listDOM.append(ccn_template_sharingTargetItem.render(renderdata));

    // bind event
    var uuid = index;
    $("#ccn-calendar-sharingTargetItem-btnDelete-" + uuid).click(ccn_calendar_sharingTargetList_ItemDelete);
}


function ccn_calendar_shared_Refresh() {
    ccn_calendar_sharedListCache = new Array();
    ccn_calendar_shared_displayCache = new Array();

    var result = ccn_api_collection_getShared();
    if (typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_sharedListCache[result[index][0]] = result[index];
            ccn_calendar_shared_displayCache[result[index][0]] = true;
        }
    }

    var renderdata = {
        uuid: undefined,
        name: undefined,
        username: undefined
    }

    var listDOM = $('#ccn-calendar-sharedList');
    listDOM.empty();
    for(var index in ccn_calendar_sharedListCache) {
        var item = ccn_calendar_sharedListCache[index];
        renderdata.uuid = item[0];
        renderdata.name = item[1];
        renderdata.username = item[2];

        listDOM.append(ccn_template_sharedItem.render(renderdata));

        // bind event
        var uuid = renderdata.uuid;
        $('#ccn-admin-userItem-btnHide-' + uuid).click(ccn_calendar_sharedList_ItemSwitchDisplay);
        $('#ccn-admin-userItem-btnShow-' + uuid).click(ccn_calendar_sharedList_ItemSwitchDisplay);
    }

    ccn_i18n_ApplyLanguage2Content(listDOM);
}

function ccn_calendar_shared_ChangeDisplayMode(uuid, isShow) {
    if (isShow) {
        $('#ccn-admin-userItem-btnHide-' + uuid).show();
        $('#ccn-admin-userItem-btnShow-' + uuid).hide();
    } else {
        $('#ccn-admin-userItem-btnHide-' + uuid).hide();
        $('#ccn-admin-userItem-btnShow-' + uuid).show();
    }
}

// ========================= input operation

function ccn_calendar_sharingList_Add() {
    var newname = $('#ccn-calendar-sharing-inputAdd').val();
    if (newname == "") return;

    var result = ccn_api_collection_addOwn(newname);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-add"));
    else {
        // second get. get detail
        result = ccn_api_collection_getDetailOwn(result);

        if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-get"));
        else {
            // render
            ccn_admin_userListCache[result[0]] = result;
            var listDOM = $('#ccn-calendar-sharingList');
            ccn_calendar_sharing_RenderItem(result, listDOM);
        }
    }
}

function ccn_calendar_sharingList_ItemEdit() {
    var uuid = $(this).attr("uuid");

    // preset inputbox
    $('#ccn-admin-userItem-inputName-' + uuid).val(
        ccn_calendar_sharingListCache[uuid][1]
    );

    // switch to edit mode
    ccn_calendar_sharing_ChangeDisplayMode(uuid, undefined, true);
}

function ccn_calendar_sharingList_ItemDelete() {
    var uuid = $(this).attr("uuid");

    var result = ccn_api_collection_deleteOwn(
        uuid,
        ccn_calendar_sharingListCache[uuid][2]
    );
    if (!result) ccn_messagebox_Show($.i18n.prop("ccn-js-fail-delete"));
    else {
        $('#ccn-calendar-sharingItem-' + uuid).remove();

        // also, we should notice sharing target, and try clean it
        if (ccn_calendar_editingSharing == uuid) {
            ccn_calendar_editingSharing = undefined;
            ccn_calendar_sharingTarget_Refresh();
        }
    }
}

function ccn_calendar_sharingList_ItemUpdate() {
    var uuid = $(this).attr("uuid");
    var newname = $('#ccn-admin-userItem-inputName-' + uuid).val();

    var result = ccn_api_collection_updateOwn(uuid, newname, ccn_calendar_sharingListCache[uuid][2]);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-update"));
    else {
        // update last change
        ccn_calendar_sharingListCache[uuid][2] = result;
        ccn_calendar_sharingListCache[uuid][1] = newname;
        // update elements
        $('#ccn-admin-userItem-textName-' + uuid).text(newname);
        // if editing, update sharing target
        if (ccn_calendar_editingSharing == uuid)
            ccn_calendar_sharingTarget_Refresh();
        // back to normal mode
        ccn_calendar_sharing_ChangeDisplayMode(uuid, undefined, false);
    }
}

function ccn_calendar_sharingList_ItemCancelUpdate() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_sharing_ChangeDisplayMode(uuid, undefined, false);
}

function ccn_calendar_sharingList_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_sharing_displayCache[uuid] = !(ccn_calendar_sharing_displayCache[uuid]);
    ccn_calendar_sharing_ChangeDisplayMode(uuid, ccn_calendar_sharing_displayCache[uuid], undefined);
}

function ccn_calendar_sharingList_ItemShare() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_editingSharing = uuid;
    ccn_calendar_sharingTarget_Refresh();
}


function ccn_calendar_sharingTargetList_Add() {
    var newusername = $('#ccn-calendar-sharingTarget-inputAdd').val();
    if (newusername == "" || typeof(ccn_calendar_editingSharing) == 'undefined') return;

    var result = ccn_api_collection_addSharing(
        ccn_calendar_editingSharing,
        newusername,
        ccn_calendar_sharingListCache[ccn_calendar_editingSharing][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-add"));
    else {
        // add new item
        var index = ccn_calendar_sharingTargetListCache.push(newusername) - 1;
        var listDOM = $('#ccn-calendar-sharingTargetList');
        ccn_calendar_sharingTarget_RenderItem(newusername, index, listDOM);
        // update last change
        ccn_calendar_sharingListCache[ccn_calendar_editingSharing][2] = result;
    }
}

function ccn_calendar_sharingTargetList_ItemDelete() {
    var uuid = $(this).attr("uuid");
    var username = ccn_calendar_sharingTargetListCache[uuid];

    var result = ccn_api_collection_deleteSharing(
        ccn_calendar_editingSharing,
        username,
        ccn_calendar_sharingListCache[ccn_calendar_editingSharing][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-delete"));
    else {
        // remove item in ui
        $('#ccn-calendar-sharingTargetItem-' + uuid).remove();
        // update last change
        ccn_calendar_sharingListCache[ccn_calendar_editingSharing][2] = result;
    }
}


function ccn_calendar_sharedList_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_shared_displayCache[uuid] = !(ccn_calendar_shared_displayCache[uuid]);
    ccn_calendar_shared_ChangeDisplayMode(uuid, ccn_calendar_shared_displayCache[uuid]);
}
