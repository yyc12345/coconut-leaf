// all args are based on 1
function ccn_tabcontrol_SwitchTab(tabcontrolGroup, targetTabIndex) {
    // close all panel and tab
    $(".tabcontrol-tab-" + tabcontrolGroup).removeClass("is-active");
    $(".tabcontrol-panel-" + tabcontrolGroup).hide();

    // show specific
    $("#tabcontrol-tab-"  + tabcontrolGroup + "-" + targetTabIndex).addClass("is-active");
    $("#tabcontrol-panel-"  + tabcontrolGroup + "-" + targetTabIndex).show();
}