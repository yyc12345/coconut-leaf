var ccn_admin_userListCache = [];

$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.admin;
    
    // template process
    ccn_template_Load();
    
    // nav process
    ccn_headerNav_Insert();
    ccn_headerNav_BindEvents();
    ccn_headerNav_LoggedRefresh();

    // messagebox process
    ccn_messagebox_Insert();
    ccn_messagebox_BindEvent();

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

    // load user tab according to admin status
    if(!ccn_api_common_isAdmin())
        $('#tabcontrol-tab-1-3').hide();

    // apply i18n
    ccn_i18n_LoadLanguage();
    ccn_i18n_ApplyLanguage();

    // bind event
    $('#ccn-admin-profile-btnChangePassword').click(ccn_admin_profile_ChangePassword);
    $('#ccn-admin-userList-btnAdd').click(ccn_admin_userList_Add);
    $('#ccn-admin-userList-btnRefresh').click(ccn_admin_userList_Refresh);
});

// ================== profile

function ccn_admin_profile_ChangePassword() {
    var newpassword = $('#ccn-admin-profile-inputPassword').val();
    if (newpassword == "") return;

    var result = ccn_api_common_changePassword(newpassword);
    if(result) {
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-success"));
        $('#ccn-admin-profile-inputPassword').val('');
    } else
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-update"));
    
}

// ================== user list

function ccn_admin_userList_RefreshCacheList() {
    ccn_admin_userListCache = new Array();

    var result = ccn_api_admin_get();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_admin_userListCache[index] = result[index];
        }
    }
}

function ccn_admin_userList_RenderItem(item, index, listDOM) {
    var renderdata = {
        uuid: index, // use index for uuid. there are no uuid for user
        username: item[0]
    }

    // render
    listDOM.append(ccn_template_userItem.render(renderdata));

    // set mode
    var uuid = index;
    ccn_admin_userList_ChangeDisplayMode(uuid, false, item[1])

    // bind event
    $("#ccn-userItem-btnEdit-" + uuid).click(ccn_admin_userList_ItemEdit);
    $("#ccn-userItem-btnDelete-" + uuid).click(ccn_admin_userList_ItemDelete);
    $("#ccn-userItem-btnUpdate-" + uuid).click(ccn_admin_userList_ItemUpdate);
    $("#ccn-userItem-btnCancelUpdate-" + uuid).click(ccn_admin_userList_ItemCancelUpdate);
}

function ccn_admin_userList_RenderCacheList() {
    $('#ccn-admin-userList').empty();

    var listDOM = $('#ccn-admin-userList');
    for(var index in ccn_admin_userListCache) {
        ccn_admin_userList_RenderItem(
            ccn_admin_userListCache[index],
            index,
            listDOM
        )
    }

    ccn_i18n_ApplyLanguage2Content(listDOM);
}

function ccn_admin_userList_ChangeDisplayMode(uuid, isEdit, isAdmin) {
    if (typeof(isAdmin) != 'undefined') {
        if (isAdmin)
            $("#ccn-userItem-iconIsAdmin-" + uuid).show();
        else
            $("#ccn-userItem-iconIsAdmin-" + uuid).hide();
    }

    if (typeof(isEdit) != 'undefined') {
        if (isEdit) {
            $("#ccn-userItem-btnEdit-" + uuid).hide();
            $("#ccn-userItem-btnDelete-" + uuid).hide();
            $("#ccn-userItem-btnUpdate-" + uuid).show();
            $("#ccn-userItem-btnCancelUpdate-" + uuid).show();

            $("#ccn-userItem-boxPassword-" + uuid).show();
            $("#ccn-userItem-boxIsAdmin-" + uuid).show();
        } else {
            $("#ccn-userItem-btnEdit-" + uuid).show();
            $("#ccn-userItem-btnDelete-" + uuid).show();
            $("#ccn-userItem-btnUpdate-" + uuid).hide();
            $("#ccn-userItem-btnCancelUpdate-" + uuid).hide();
            
            $("#ccn-userItem-boxPassword-" + uuid).hide();
            $("#ccn-userItem-boxIsAdmin-" + uuid).hide();
        }
    }
}

function ccn_admin_userList_Refresh() {
    // refresh and render once
    ccn_admin_userList_RefreshCacheList();
    ccn_admin_userList_RenderCacheList();
}

function ccn_admin_userList_Add() {
    var username = $('#ccn-admin-userList-inputUsername').val();
    if (username == "") return;

    var result = ccn_api_admin_add(username);
    if (typeof(result) == 'undefined') {
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-add"));
    } else {
        // render
        var index = ccn_admin_userListCache.push(result) - 1;
        var listDOM = $('#ccn-admin-userList');
        ccn_admin_userList_RenderItem(result, index, listDOM);
        ccn_i18n_ApplyLanguage2Content(listDOM);
    }
}

function ccn_admin_userList_ItemEdit() {
    var uuid = $(this).attr("uuid");

    // copy isAdmin to checkbox and clean password box
    $('#ccn-userItem-inputIsAdmin-' + uuid).prop("checked", ccn_admin_userListCache[uuid][1]);
    $('#ccn-userItem-inputPassword-' + uuid).val('');

    // switch to edit mode
    ccn_admin_userList_ChangeDisplayMode(uuid, true, undefined);
}

function ccn_admin_userList_ItemDelete() {
    var uuid = $(this).attr("uuid");
    
    var result = ccn_api_admin_delete(ccn_admin_userListCache[uuid][0]);

    if(!result) {
        // fail
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-delete"));
    } else {
        // remove body
        $("#ccn-userItem-" + uuid).remove();
    }
}

function ccn_admin_userList_ItemUpdate() {
    var uuid = $(this).attr("uuid");
    var newpassword = $('#ccn-userItem-inputPassword-' + uuid).val();
    var isAdmin = $('#ccn-userItem-inputIsAdmin-' + uuid).prop("checked");

    var result = ccn_api_admin_update(
        ccn_admin_userListCache[uuid][0],
        newpassword == "" ? undefined : newpassword,
        isAdmin == ccn_admin_userListCache[uuid][1] ? undefined : isAdmin);

    if (!result) {
        // fail
        ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-update"));
    } else {
        // safely update data
        ccn_admin_userListCache[uuid][1] = isAdmin

        // switch to normal mode
        ccn_admin_userList_ChangeDisplayMode(uuid, false, isAdmin);
    }
}

function ccn_admin_userList_ItemCancelUpdate() {
    var uuid = $(this).attr("uuid");
    ccn_admin_userList_ChangeDisplayMode(uuid, false, undefined);
}
