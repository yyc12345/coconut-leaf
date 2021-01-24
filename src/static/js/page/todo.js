var ccn_todo_todoListCache = [];

$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.todo;

    // template process
    ccn_template_Load();

    // nav process
    cnn_headerNav_Insert();
    cnn_headerNav_BindEvents();
    cnn_headerNav_LoggedRefresh();

    // refresh once
    ccn_todo_Refresh();
    
    // bind event
    $("#ccn-todo-btnAdd").click(ccn_todo_Add);
    $("#ccn-todo-btnRefresh").click(ccn_todo_Refresh);

    // apply i18n
    ccn_i18n_ApplyLanguage();
});

function ccn_todo_RefreshCacheList() {
    // clean list cache first
    ccn_todo_todoListCache = new Array();

    var result = cnn_api_todo_getFull();
    if(typeof(result) != 'undefined') {
        for(var index in result) {
            ccn_todo_todoListCache[result[index][0]] = result[index];
        }
    }

}

function ccn_todo_RenderCacheList() {
    // clean list first
    $("#ccn-todo-todoList").empty();
    
    var renderdata = {
        uuid: undefined,
        data: undefined
    };

    var listDOM = $("#ccn-todo-todoList");
    for(var index in ccn_todo_todoListCache) {
        // update render data
        var item = ccn_todo_todoListCache[index];
        renderdata.uuid = item[0];
        renderdata.data = LineBreaker2Br(item[2]);

        // render
        listDOM.append(ccn_template_todoItem.render(renderdata));

        // set mode
        var uuid = renderdata.uuid;
        ccn_todo_ChangeDisplayMode(uuid, false);

        // bind event
        $("#ccn-todo-todoItem-btnEdit-" + uuid).click(ccn_todo_ItemEdit);
        $("#ccn-todo-todoItem-btnDelete-" + uuid).click(ccn_todo_ItemDelete);
        $("#ccn-todo-todoItem-btnUpdate-" + uuid).click(ccn_todo_ItemUpdate);
        $("#ccn-todo-todoItem-btnCancelUpdate-" + uuid).click(ccn_todo_ItemCancelUpdate);
    }
}

function ccn_todo_ChangeDisplayMode(uuid, isEdit) {
    if(isEdit) {
        // 4 buttons
        $("#ccn-todo-todoItem-btnEdit-" + uuid).hide();
        $("#ccn-todo-todoItem-btnDelete-" + uuid).hide();
        $("#ccn-todo-todoItem-btnUpdate-" + uuid).show();
        $("#ccn-todo-todoItem-btnCancelUpdate-" + uuid).show();

        // 2 elements
        $("#ccn-todo-todoItem-p-" + uuid).hide();
        $("#ccn-todo-todoItem-textarea-" + uuid).show();
    } else {
        $("#ccn-todo-todoItem-btnEdit-" + uuid).show();
        $("#ccn-todo-todoItem-btnDelete-" + uuid).show();
        $("#ccn-todo-todoItem-btnUpdate-" + uuid).hide();
        $("#ccn-todo-todoItem-btnCancelUpdate-" + uuid).hide();

        $("#ccn-todo-todoItem-p-" + uuid).show();
        $("#ccn-todo-todoItem-textarea-" + uuid).hide();
    }

}

function ccn_todo_Refresh() {
    // refresh and render once
    ccn_todo_RefreshCacheList();
    ccn_todo_RenderCacheList();
}

function ccn_todo_Add() {
    var result = cnn_api_todo_add();
    if (typeof(result) == 'undefined') {
        // fail
        alert($.i18n.prop("ccn-js-failToOperate"));
    } else {
        // add into cache
        ccn_todo_todoListCache[result[0]] = result;

        // render
        var listDOM = $("#ccn-todo-todoList");
        listDOM.append(ccn_template_todoItem.render({
            uuid: result[0],
            data: LineBreaker2Br(result[2])
        }));

        // set mode
        var uuid = result[0];
        ccn_todo_ChangeDisplayMode(uuid, false);

        // bind event
        $("#ccn-todo-todoItem-btnEdit-" + uuid).click(ccn_todo_ItemEdit);
        $("#ccn-todo-todoItem-btnDelete-" + uuid).click(ccn_todo_ItemDelete);
        $("#ccn-todo-todoItem-btnUpdate-" + uuid).click(ccn_todo_ItemUpdate);
        $("#ccn-todo-todoItem-btnCancelUpdate-" + uuid).click(ccn_todo_ItemCancelUpdate);
    }
}

function ccn_todo_ItemEdit() {
    var uuid = $(this).attr("uuid");

    // copy current data to textarea
    $("#ccn-todo-todoItem-textarea-" + uuid).val(
        ccn_todo_todoListCache[uuid][2]
    );

    // switch to edit mode
    ccn_todo_ChangeDisplayMode(uuid, true);
}

function ccn_todo_ItemDelete() {
    var uuid = $(this).attr("uuid");
    
    var result = cnn_api_todo_delete(
        uuid,
        ccn_todo_todoListCache[uuid][3]
    );

    if(typeof(result) == 'undefined') {
        // fail
        alert($.i18n.prop("ccn-js-failToOperate"));
    } else {
        // remove body
        $("#ccn-todo-todoItem-" + uuid).remove();
    }
}

function ccn_todo_ItemUpdate() {
    var uuid = $(this).attr("uuid");

    var newData = $("#ccn-todo-todoItem-textarea-" + uuid).val();
    var result = cnn_api_todo_update(
        uuid, 
        newData, 
        ccn_todo_todoListCache[uuid][3]
    );

    if (typeof(result) == 'undefined') {
        // fail
        alert($.i18n.prop("ccn-js-failToOperate"));
    } else {
        // safely update data & lastChanged and control
        ccn_todo_todoListCache[uuid][2] = newData;
        ccn_todo_todoListCache[uuid][3] = result;
        $("#ccn-todo-todoItem-p-" + uuid).html(LineBreaker2Br(newData));

        // switch to normal mode
        ccn_todo_ChangeDisplayMode(uuid, false);
    }
}

function ccn_todo_ItemCancelUpdate() {
    var uuid = $(this).attr("uuid");
    // clean data
    $("#ccn-todo-todoItem-textarea-" + uuid).val("");
    // switch to normal mode
    ccn_todo_ChangeDisplayMode(uuid, false);
}
