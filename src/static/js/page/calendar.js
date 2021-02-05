// 3 used cache list
var ccn_calendar_owned_listCache = [];
var ccn_calendar_sharing_listCache = [];
var ccn_calendar_shared_listCache = [];

// current editing sharing collection
var ccn_calendar_sharing_editingOwned = undefined; // the uuid of owned collection

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

    //refresh once
    ccn_calendar_shared_Refresh();
    ccn_calendar_owned_Refresh();

    // bind event
    $('#ccn-calendar-shared-btnRefresh').click(ccn_calendar_shared_Refresh);
    $('#ccn-calendar-owned-btnAdd').click(ccn_calendar_owned_Add);
    $('#ccn-calendar-own-btnRefresh').click(ccn_calendar_owned_Refresh);
    $('#ccn-calendar-sharing-btnAdd').click(ccn_calendar_sharing_Add);
    $('#ccn-calendar-sharing-btnRefresh').click(ccn_calendar_sharing_Refresh);
});

// ================== calendar

function ccn_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBbody').append(ccn_template_calendarItem.render());
}

// ================== collection

function ccn_calendar_owned_Refresh() {
    ccn_calendar_owned_listCache = new Array();
    ccn_calendar_sharing_displayCache = new Array();

    var result = ccn_api_collection_getFullOwn();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_owned_listCache[result[index][0]] = result[index];
            ccn_calendar_sharing_displayCache[result[index][0]] = true;
        }
    }

    // render
    var listDOM = $('#ccn-calendar-ownedList');
    listDOM.empty();
    for(var index in ccn_calendar_owned_listCache) {
        ccn_calendar_owned_RenderItem(
            ccn_calendar_owned_listCache[index],
            listDOM
        )
    }
    
    // also, order sharing list clean
    ccn_calendar_sharing_editingOwned = undefined;
    ccn_calendar_sharing_Refresh();
}

function ccn_calendar_owned_RenderItem(item, listDOM) {
    var renderdata = {
        uuid: item[0],
        name: item[1]
    }

    // render
    listDOM.append(ccn_template_ownedItem.render(renderdata));

    // set mode
    var uuid = renderdata.uuid;
    ccn_calendar_owned_ChangeDisplayMode(uuid, true, false);

    // bind event
    $('#ccn-calendar-ownedItem-btnEdit-' + uuid).click(ccn_calendar_owned_ItemEdit);
    $('#ccn-calendar-ownedItem-btnDelete-' + uuid).click(ccn_calendar_owned_ItemDelete);
    $('#ccn-calendar-ownedItem-btnShare-' + uuid).click(ccn_calendar_owned_ItemShare);
    $('#ccn-calendar-ownedItem-btnHide-' + uuid).click(ccn_calendar_owned_ItemSwitchDisplay);
    $('#ccn-calendar-ownedItem-btnShow-' + uuid).click(ccn_calendar_owned_ItemSwitchDisplay);
    $('#ccn-calendar-ownedItem-btnUpdate-' + uuid).click(ccn_calendar_owned_ItemUpdate);
    $('#ccn-calendar-ownedItem-btnCancelUpdate-' + uuid).click(ccn_calendar_owned_ItemCancelUpdate);
    
}

function ccn_calendar_owned_ChangeDisplayMode(uuid, isShow, isEdit) {
    if (typeof(isShow) != 'undefined') {
        if (isShow) {
            $('#ccn-calendar-ownedItem-btnHide-' + uuid).show();
            $('#ccn-calendar-ownedItem-btnShow-' + uuid).hide();
        } else {
            $('#ccn-calendar-ownedItem-btnHide-' + uuid).hide();
            $('#ccn-calendar-ownedItem-btnShow-' + uuid).show();
        }
    }

    if (typeof(isEdit) != 'undefined') {
        if (isEdit) {
            $('#ccn-calendar-ownedItem-btnEdit-' + uuid).hide();
            $('#ccn-calendar-ownedItem-btnShare-' + uuid).hide();
            $('#ccn-calendar-ownedItem-btnDelete-' + uuid).hide();

            $('#ccn-calendar-ownedItem-btnUpdate-' + uuid).show();
            $('#ccn-calendar-ownedItem-btnCancelUpdate-' + uuid).show();

            $('#ccn-calendar-ownedItem-textName-' + uuid).hide();
            $('#ccn-calendar-ownedItem-boxName-' + uuid).show();
        } else {
            $('#ccn-calendar-ownedItem-btnEdit-' + uuid).show();
            $('#ccn-calendar-ownedItem-btnShare-' + uuid).show();
            $('#ccn-calendar-ownedItem-btnDelete-' + uuid).show();

            $('#ccn-calendar-ownedItem-btnUpdate-' + uuid).hide();
            $('#ccn-calendar-ownedItem-btnCancelUpdate-' + uuid).hide();

            $('#ccn-calendar-ownedItem-textName-' + uuid).show();
            $('#ccn-calendar-ownedItem-boxName-' + uuid).hide();
        }
    }
}



function ccn_calendar_sharing_Refresh() {
    ccn_calendar_sharing_listCache = new Array();

    if (typeof(ccn_calendar_sharing_editingOwned) != 'undefined') {
        var result = ccn_api_collection_getSharing(ccn_calendar_sharing_editingOwned);
        if (typeof(result) != 'undefined') {
            for(var index in result) {
                ccn_calendar_sharing_listCache[index] = result[index];
                // also, sharingTarget don't have uuid, use index instead
            }
        }
    }

    // update editing text
    $('#ccn-calendar-sharing-sharingEditing').text(
        typeof(ccn_calendar_sharing_editingOwned) == 'undefined' ?
        '' :
        ccn_calendar_owned_listCache[ccn_calendar_sharing_editingOwned][1]
    );

    // if editing is undefined, hide container
    if (typeof(ccn_calendar_sharing_editingOwned) == 'undefined')
        $('#ccn-calendar-sharing-container').hide();
    else
        $('#ccn-calendar-sharing-container').show();


    var listDOM = $('#ccn-calendar-sharingList');
    listDOM.empty();
    for(var index in ccn_calendar_sharing_listCache) {
        ccn_calendar_sharing_RenderItem(
            ccn_calendar_sharing_listCache[index],
            index,
            listDOM
        )
    }
}

function ccn_calendar_sharing_RenderItem(item, index, listDOM) {
    var renderdata = {
        uuid: index,
        username: item
    }

    // render
    listDOM.append(ccn_template_sharingItem.render(renderdata));

    // bind event
    var uuid = index;
    $("#ccn-calendar-sharingItem-btnDelete-" + uuid).click(ccn_calendar_sharing_ItemDelete);
}


function ccn_calendar_shared_Refresh() {
    ccn_calendar_shared_listCache = new Array();
    ccn_calendar_shared_displayCache = new Array();

    var result = ccn_api_collection_getShared();
    if (typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_calendar_shared_listCache[result[index][0]] = result[index];
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
    for(var index in ccn_calendar_shared_listCache) {
        var item = ccn_calendar_shared_listCache[index];
        renderdata.uuid = item[0];
        renderdata.name = item[1];
        renderdata.username = item[2];

        listDOM.append(ccn_template_sharedItem.render(renderdata));

        // change display
        var uuid = renderdata.uuid;
        ccn_calendar_shared_ChangeDisplayMode(uuid, true);

        // bind event
        $('#ccn-calendar-sharedItem-btnHide-' + uuid).click(ccn_calendar_shared_ItemSwitchDisplay);
        $('#ccn-calendar-sharedItem-btnShow-' + uuid).click(ccn_calendar_shared_ItemSwitchDisplay);
    }

    ccn_i18n_ApplyLanguage2Content(listDOM);
}

function ccn_calendar_shared_ChangeDisplayMode(uuid, isShow) {
    if (isShow) {
        $('#ccn-calendar-sharedItem-btnHide-' + uuid).show();
        $('#ccn-calendar-sharedItem-btnShow-' + uuid).hide();
    } else {
        $('#ccn-calendar-sharedItem-btnHide-' + uuid).hide();
        $('#ccn-calendar-sharedItem-btnShow-' + uuid).show();
    }
}

// ========================= input operation

function ccn_calendar_owned_Add() {
    var newname = $('#ccn-calendar-owned-inputAdd').val();
    if (newname == "") return;

    var result = ccn_api_collection_addOwn(newname);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-add"));
    else {
        // second get. get detail
        result = ccn_api_collection_getDetailOwn(result);

        if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-get"));
        else {
            // render
            ccn_calendar_owned_listCache[result[0]] = result;
            var listDOM = $('#ccn-calendar-ownedList');
            ccn_calendar_owned_RenderItem(result, listDOM);
        }
    }
}

function ccn_calendar_owned_ItemEdit() {
    var uuid = $(this).attr("uuid");

    // preset inputbox
    $('#ccn-calendar-ownedItem-inputName-' + uuid).val(
        ccn_calendar_owned_listCache[uuid][1]
    );

    // switch to edit mode
    ccn_calendar_owned_ChangeDisplayMode(uuid, undefined, true);
}

function ccn_calendar_owned_ItemDelete() {
    var uuid = $(this).attr("uuid");

    var result = ccn_api_collection_deleteOwn(
        uuid,
        ccn_calendar_owned_listCache[uuid][2]
    );
    if (!result) ccn_messagebox_Show($.i18n.prop("ccn-js-fail-delete"));
    else {
        $('#ccn-calendar-ownedItem-' + uuid).remove();

        // also, we should notice sharing target, and try clean it
        if (ccn_calendar_sharing_editingOwned == uuid) {
            ccn_calendar_sharing_editingOwned = undefined;
            ccn_calendar_sharing_Refresh();
        }
    }
}

function ccn_calendar_owned_ItemUpdate() {
    var uuid = $(this).attr("uuid");
    var newname = $('#ccn-calendar-ownedItem-inputName-' + uuid).val();

    var result = ccn_api_collection_updateOwn(uuid, newname, ccn_calendar_owned_listCache[uuid][2]);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-update"));
    else {
        // update last change
        ccn_calendar_owned_listCache[uuid][2] = result;
        ccn_calendar_owned_listCache[uuid][1] = newname;
        // update elements
        $('#ccn-calendar-ownedItem-textName-' + uuid).text(newname);
        // if editing, update sharing target
        if (ccn_calendar_sharing_editingOwned == uuid)
            ccn_calendar_sharing_Refresh();
        // back to normal mode
        ccn_calendar_owned_ChangeDisplayMode(uuid, undefined, false);
    }
}

function ccn_calendar_owned_ItemCancelUpdate() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_owned_ChangeDisplayMode(uuid, undefined, false);
}

function ccn_calendar_owned_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_sharing_displayCache[uuid] = !(ccn_calendar_sharing_displayCache[uuid]);
    ccn_calendar_owned_ChangeDisplayMode(uuid, ccn_calendar_sharing_displayCache[uuid], undefined);
}

function ccn_calendar_owned_ItemShare() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_sharing_editingOwned = uuid;
    ccn_calendar_sharing_Refresh();
}


function ccn_calendar_sharing_Add() {
    var newusername = $('#ccn-calendar-sharing-inputAdd').val();
    if (newusername == "" || typeof(ccn_calendar_sharing_editingOwned) == 'undefined') return;

    var result = ccn_api_collection_addSharing(
        ccn_calendar_sharing_editingOwned,
        newusername,
        ccn_calendar_owned_listCache[ccn_calendar_sharing_editingOwned][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-add"));
    else {
        // add new item
        var index = ccn_calendar_sharing_listCache.push(newusername) - 1;
        var listDOM = $('#ccn-calendar-sharingList');
        ccn_calendar_sharing_RenderItem(newusername, index, listDOM);
        // update last change
        ccn_calendar_owned_listCache[ccn_calendar_sharing_editingOwned][2] = result;
    }
}

function ccn_calendar_sharing_ItemDelete() {
    var uuid = $(this).attr("uuid");
    var username = ccn_calendar_sharing_listCache[uuid];

    var result = ccn_api_collection_deleteSharing(
        ccn_calendar_sharing_editingOwned,
        username,
        ccn_calendar_owned_listCache[ccn_calendar_sharing_editingOwned][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-js-fail-delete"));
    else {
        // remove item in ui
        $('#ccn-calendar-sharingItem-' + uuid).remove();
        // update last change
        ccn_calendar_owned_listCache[ccn_calendar_sharing_editingOwned][2] = result;
    }
}


function ccn_calendar_shared_ItemSwitchDisplay() {
    var uuid = $(this).attr("uuid");
    ccn_calendar_shared_displayCache[uuid] = !(ccn_calendar_shared_displayCache[uuid]);
    ccn_calendar_shared_ChangeDisplayMode(uuid, ccn_calendar_shared_displayCache[uuid]);
}
