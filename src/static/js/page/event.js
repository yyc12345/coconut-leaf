$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.event;

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
    
    // init datetimepicker
    ccn_datetimepicker_Init();

    // init span picker
    $('.spanpicker').attr('max', 100)
    .attr('min', 1)
    .attr('step', 1)
    .val(1);

    // refresh once

    
    // bind event

});


function ccn_event_Deploy() {
    var isAdd = typeof(ccn_calendar_eventModal_editing) == 'undefined';
    $('#ccn-event-inputTitle').val(
        isAdd ? '' : ccn_calendar_eventModal_editing[2]
    );
    $('#ccn-event-inputDescription').val(
        isAdd ? '' : ccn_calendar_eventModal_editing[3]
    );

    // we also need render eventModal collection select
    var collectionDOM = $('#ccn-event-inputCollection');
    collectionDOM.options.length = 0;
    for(var index in ccn_calendar_eventModal_collectionCache) {
        var uuid = ccn_calendar_eventModal_collectionCache[index];
        collectionDOM.add(new Option(

        ));
    }
    $('#ccn-event-inputCollection').selectedIndex = isAdd ? -1 : ccn_calendar_eventModal_collectionCache.indexOf(ccn_calendar_eventModal_editing[1]);

    var currentDateTime = new Date();
    currentDateTime.setMilliseconds(0);
    currentDateTime.setSeconds(0);
    currentDateTime.setMinutes(0);
    ccn_datetimepicker_Set(1, currentDateTime);

    currentDateTime.setHours(currentDateTime.getHours() + 2);
    ccn_datetimepicker_Set(2, currentDateTime);



}

function ccn_event_Refresh() {

}

// return undefined to indicate an error
function ccn_event_Get() {

}
