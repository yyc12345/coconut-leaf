$(document).ready(function() {
    // nav process
    ccn_pages_currentPage = ccn_pages_enumPages.calendar;
    cnn_headerNav_Insert();
    cnn_headerNav_BindEvents();
    cnn_headerNav_LoggedRefresh();

    // process calendar it self
    ccn_calendar_LoadCalendarBody();

    // apply i18n
    ccn_i18n_ApplyLanguage();
});

function ccn_calendar_LoadCalendarBody() {
    $.ajax({
        url: $("#jsrender-tmpl-calendarItem").attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            var tmpl = $.templates(data);
            $('#ccn-calendar-calendarBbody').append(tmpl.render());
        }
    });
}
