var ccn_template_headerNav = undefined;
var ccn_template_messagebox = undefined;
var ccn_template_datetimepicker = undefined;
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
    ccn_template_headerNav = ccn_template_TemplateLoader('headerNav');
    ccn_template_messagebox = ccn_template_TemplateLoader('messagebox');
    ccn_template_datetimepicker = ccn_template_TemplateLoader('datetimepicker');

    ccn_template_calendarItem = ccn_template_TemplateLoader('calendarItem');
    ccn_template_scheduleItem = ccn_template_TemplateLoader('scheduleItem');
    ccn_template_displayOwnedItem = ccn_template_TemplateLoader('displayOwnedItem');
    ccn_template_displaySharedItem = ccn_template_TemplateLoader('displaySharedItem');

    ccn_template_todoItem = ccn_template_TemplateLoader('todoItem');
    ccn_template_userItem = ccn_template_TemplateLoader('userItem');
    ccn_template_tokenItem = ccn_template_TemplateLoader('tokenItem');

    ccn_template_ownedItem = ccn_template_TemplateLoader('ownedItem');
    ccn_template_sharingItem = ccn_template_TemplateLoader('sharingItem');
    ccn_template_optionItem = ccn_template_TemplateLoader('optionItem');

}

function ccn_template_TemplateLoader(templateName) {
    var elements = $("#jsrender-tmpl-" + templateName);
    if (elements.length == 0) return undefined;
    var cache = undefined;

    $.ajax({
        url: elements.attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            cache = $.templates(data);
        }
    });

    return cache;
}