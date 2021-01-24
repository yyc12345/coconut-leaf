$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.calendar;
        
    // template process
    ccn_template_Load();
    
    // nav process
    cnn_headerNav_Insert();
    cnn_headerNav_BindEvents();
    cnn_headerNav_LoggedRefresh();

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
