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
    ccn_i18n_ApplyLanguage();
});

function ccn_calendar_LoadCalendarBody() {
    $('#ccn-calendar-calendarBbody').append(ccn_template_calendarItem.render());
}
