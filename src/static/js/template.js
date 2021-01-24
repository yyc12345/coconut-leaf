var ccn_template_headerNav = undefined;
var ccn_template_calendarItem = undefined;
var ccn_template_scheduleItem = undefined;
var ccn_template_userItem = undefined;
var ccn_template_todoItem = undefined;

function ccn_template_Load() {
    $.ajax({
        url: $("#jsrender-tmpl-headerNav").attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            ccn_template_headerNav = $.templates(data);
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
            break;
        case ccn_pages_enumPages.login:
            break;
    }
}