// 3 used cache list
var ccn_collection_owned_listCache = [];
var ccn_collection_sharing_listCache = [];

// current editing sharing collection
var ccn_collection_sharing_editingOwned = undefined; // the uuid of owned collection

$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.collection;

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

    //refresh once
    ccn_collection_owned_Refresh();

    // bind event
    //$('#ccn-calendar-shared-btnRefresh').click(ccn_calendar_shared_Refresh);
    $('#ccn-collection-owned-btnAdd').click(ccn_collection_owned_Add);
    $('#ccn-collection-owned-btnRefresh').click(ccn_collection_owned_Refresh);
    $('#ccn-collection-sharing-btnAdd').click(ccn_collection_sharing_Add);
    $('#ccn-collection-sharing-btnRefresh').click(ccn_collection_sharing_Refresh);

});


function ccn_collection_owned_Refresh() {
    ccn_collection_owned_listCache = new Array();
    ccn_collection_sharing_displayCache = new Array();

    var result = ccn_api_collection_getFullOwn();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_collection_owned_listCache[result[index][0]] = result[index];
        }
    }

    // render
    var listDOM = $('#ccn-collection-ownedList');
    listDOM.empty();
    for(var index in ccn_collection_owned_listCache) {
        ccn_collection_owned_RenderItem(
            ccn_collection_owned_listCache[index],
            listDOM
        );
    }
    
    // also, order sharing list clean
    ccn_collection_sharing_editingOwned = undefined;
    ccn_collection_sharing_Refresh();
}

function ccn_collection_owned_RenderItem(item, listDOM) {
    var renderdata = {
        uuid: item[0],
        name: item[1]
    }

    // render
    listDOM.append(ccn_template_ownedItem.render(renderdata));

    // set mode
    var uuid = renderdata.uuid;
    ccn_collection_owned_ChangeDisplayMode(uuid, false);

    // bind event
    $('#ccn-ownedItem-btnEdit-' + uuid).click(ccn_collection_owned_ItemEdit);
    $('#ccn-ownedItem-btnDelete-' + uuid).click(ccn_collection_owned_ItemDelete);
    $('#ccn-ownedItem-btnShare-' + uuid).click(ccn_collection_owned_ItemShare);
    $('#ccn-ownedItem-btnUpdate-' + uuid).click(ccn_collection_owned_ItemUpdate);
    $('#ccn-ownedItem-btnCancelUpdate-' + uuid).click(ccn_collection_owned_ItemCancelUpdate);
    
}

function ccn_collection_owned_ChangeDisplayMode(uuid, isEdit) {
    if (isEdit) {
        $('#ccn-ownedItem-btnEdit-' + uuid).hide();
        $('#ccn-ownedItem-btnShare-' + uuid).hide();
        $('#ccn-ownedItem-btnDelete-' + uuid).hide();

        $('#ccn-ownedItem-btnUpdate-' + uuid).show();
        $('#ccn-ownedItem-btnCancelUpdate-' + uuid).show();

        $('#ccn-ownedItem-textName-' + uuid).hide();
        $('#ccn-ownedItem-boxName-' + uuid).show();
    } else {
        $('#ccn-ownedItem-btnEdit-' + uuid).show();
        $('#ccn-ownedItem-btnShare-' + uuid).show();
        $('#ccn-ownedItem-btnDelete-' + uuid).show();

        $('#ccn-ownedItem-btnUpdate-' + uuid).hide();
        $('#ccn-ownedItem-btnCancelUpdate-' + uuid).hide();

        $('#ccn-ownedItem-textName-' + uuid).show();
        $('#ccn-ownedItem-boxName-' + uuid).hide();
    }
}



function ccn_collection_sharing_Refresh() {
    ccn_collection_sharing_listCache = new Array();

    if (typeof(ccn_collection_sharing_editingOwned) != 'undefined') {
        var result = ccn_api_collection_getSharing(ccn_collection_sharing_editingOwned);
        if (typeof(result) != 'undefined') {
            for(var index in result) {
                ccn_collection_sharing_listCache[index] = result[index];
                // also, sharingTarget don't have uuid, use index instead
            }
        }
    }

    // update editing text
    $('#ccn-collection-sharing-sharingEditing').text(
        typeof(ccn_collection_sharing_editingOwned) == 'undefined' ?
        '' :
        ccn_collection_owned_listCache[ccn_collection_sharing_editingOwned][1]
    );

    // if editing is undefined, hide container
    if (typeof(ccn_collection_sharing_editingOwned) == 'undefined')
        $('#ccn-collection-sharing-container').hide();
    else
        $('#ccn-collection-sharing-container').show();


    var listDOM = $('#ccn-collection-sharingList');
    listDOM.empty();
    for(var index in ccn_collection_sharing_listCache) {
        ccn_collection_sharing_RenderItem(
            ccn_collection_sharing_listCache[index],
            index,
            listDOM
        )
    }
}

function ccn_collection_sharing_RenderItem(item, index, listDOM) {
    var renderdata = {
        uuid: index,
        username: item
    }

    // render
    listDOM.append(ccn_template_sharingItem.render(renderdata));

    // bind event
    var uuid = index;
    $("#ccn-sharingItem-btnDelete-" + uuid).click(ccn_collection_sharing_ItemDelete);
}

// ========================= input operation

function ccn_collection_owned_Add() {
    var newname = $('#ccn-collection-owned-inputAdd').val();
    if (newname == "") return;

    var result = ccn_api_collection_addOwn(newname);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-add"));
    else {
        // second get. get detail
        result = ccn_api_collection_getDetailOwn(result);

        if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-get"));
        else {
            // render
            ccn_collection_owned_listCache[result[0]] = result;
            var listDOM = $('#ccn-collection-ownedList');
            ccn_collection_owned_RenderItem(result, listDOM);
        }
    }
}

function ccn_collection_owned_ItemEdit() {
    var uuid = $(this).attr("uuid");

    // preset inputbox
    $('#ccn-ownedItem-inputName-' + uuid).val(
        ccn_collection_owned_listCache[uuid][1]
    );

    // switch to edit mode
    ccn_collection_owned_ChangeDisplayMode(uuid, true);
}

function ccn_collection_owned_ItemDelete() {
    var uuid = $(this).attr("uuid");

    var result = ccn_api_collection_deleteOwn(
        uuid,
        ccn_collection_owned_listCache[uuid][2]
    );
    if (!result) ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-delete"));
    else {
        $('#ccn-ownedItem-' + uuid).remove();

        // also, we should notice sharing target, and try clean it
        if (ccn_collection_sharing_editingOwned == uuid) {
            ccn_collection_sharing_editingOwned = undefined;
            ccn_collection_sharing_Refresh();
        }
    }
}

function ccn_collection_owned_ItemUpdate() {
    var uuid = $(this).attr("uuid");
    var newname = $('#ccn-ownedItem-inputName-' + uuid).val();

    var result = ccn_api_collection_updateOwn(uuid, newname, ccn_collection_owned_listCache[uuid][2]);
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-update"));
    else {
        // update last change
        ccn_collection_owned_listCache[uuid][2] = result;
        ccn_collection_owned_listCache[uuid][1] = newname;
        // update elements
        $('#ccn-ownedItem-textName-' + uuid).text(newname);
        // if editing, update sharing target
        if (ccn_collection_sharing_editingOwned == uuid)
            ccn_collection_sharing_Refresh();
        // back to normal mode
        ccn_collection_owned_ChangeDisplayMode(uuid, false);
    }
}

function ccn_collection_owned_ItemCancelUpdate() {
    var uuid = $(this).attr("uuid");
    ccn_collection_owned_ChangeDisplayMode(uuid, false);
}

function ccn_collection_owned_ItemShare() {
    var uuid = $(this).attr("uuid");
    ccn_collection_sharing_editingOwned = uuid;
    ccn_collection_sharing_Refresh();
}


function ccn_collection_sharing_Add() {
    var newusername = $('#ccn-collection-sharing-inputAdd').val();
    if (newusername == "" || typeof(ccn_collection_sharing_editingOwned) == 'undefined') return;

    var result = ccn_api_collection_addSharing(
        ccn_collection_sharing_editingOwned,
        newusername,
        ccn_collection_owned_listCache[ccn_collection_sharing_editingOwned][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-add"));
    else {
        // add new item
        var index = ccn_collection_sharing_listCache.push(newusername) - 1;
        var listDOM = $('#ccn-collection-sharingList');
        ccn_collection_sharing_RenderItem(newusername, index, listDOM);
        // update last change
        ccn_collection_owned_listCache[ccn_collection_sharing_editingOwned][2] = result;
    }
}

function ccn_collection_sharing_ItemDelete() {
    var uuid = $(this).attr("uuid");
    var username = ccn_collection_sharing_listCache[uuid];

    var result = ccn_api_collection_deleteSharing(
        ccn_collection_sharing_editingOwned,
        username,
        ccn_collection_owned_listCache[ccn_collection_sharing_editingOwned][2]
    );
    if (typeof(result) == 'undefined') ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-delete"));
    else {
        // remove item in ui
        $('#ccn-sharingItem-' + uuid).remove();
        // update last change
        ccn_collection_owned_listCache[ccn_collection_sharing_editingOwned][2] = result;
    }
}

