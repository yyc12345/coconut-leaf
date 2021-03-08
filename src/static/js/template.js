var ccn_template_headerNav = undefined;
var ccn_template_messagebox = undefined;
var ccn_template_calendarItem = undefined;
var ccn_template_scheduleItem = undefined;
var ccn_template_ownedItem = undefined;
var ccn_template_sharingItem = undefined;
var ccn_template_displayOwnedItem = undefined;
var ccn_template_displaySharedItem = undefined;
var ccn_template_userItem = undefined;
var ccn_template_todoItem = undefined;
var ccn_template_optionItem = undefined;
var ccn_template_tokenItem = undefined;

function ccn_template_Load() {
    $.ajax({
        url: $("#jsrender-tmpl-headerNav").attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            ccn_template_headerNav = $.templates(data);
        }
    });
    $.ajax({
        url: $("#jsrender-tmpl-messagebox").attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            ccn_template_messagebox = $.templates(data);
        }
    });

    switch(ccn_pages_currentPage) {
        case ccn_pages_enumPages.home:
            break;
        case ccn_pages_enumPages.calendar:
            $.ajax({
                url: $("#jsrender-tmpl-calendarItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_calendarItem = $.templates(data);
                }
            });
            $.ajax({
                url: $("#jsrender-tmpl-scheduleItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_scheduleItem = $.templates(data);
                }
            });
            $.ajax({
                url: $("#jsrender-tmpl-displayOwnedItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_displayOwnedItem = $.templates(data);
                }
            });
            $.ajax({
                url: $("#jsrender-tmpl-displaySharedItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_displaySharedItem = $.templates(data);
                }
            });
            break;
        case ccn_pages_enumPages.todo:
            $.ajax({
                url: $("#jsrender-tmpl-todoItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_todoItem = $.templates(data);
                }
            });
            break;
        case ccn_pages_enumPages.admin:
            $.ajax({
                url: $("#jsrender-tmpl-userItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_userItem = $.templates(data);
                }
            });
            $.ajax({
                url: $("#jsrender-tmpl-tokenItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_tokenItem = $.templates(data);
                }
            });
            break;
        case ccn_pages_enumPages.login:
            break;
        case ccn_pages_enumPages.collection:
            $.ajax({
                url: $("#jsrender-tmpl-ownedItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_ownedItem = $.templates(data);
                }
            });
            $.ajax({
                url: $("#jsrender-tmpl-sharingItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_sharingItem = $.templates(data);
                }
            });
        case ccn_pages_enumPages.event:
            $.ajax({
                url: $("#jsrender-tmpl-optionItem").attr('src'),
                type: "GET",
                async: false,
                success: function (data) {
                    ccn_template_optionItem = $.templates(data);
                }
            });
    }
}