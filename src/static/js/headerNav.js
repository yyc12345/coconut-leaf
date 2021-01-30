function ccn_headerNav_Insert() {
    $('body').prepend(ccn_template_headerNav.render());
}

function ccn_headerNav_LoggedRefresh() {
    if (ccn_api_common_tokenValid()) {
        // logged, show all nav button and logout button
        $("#ccn-header-nav-home").show();
        $("#ccn-header-nav-calendar").show();
        $("#ccn-header-nav-todo").show();
        $("#ccn-header-nav-admin").show();

        $("#ccn-header-user-login").hide();
        $("#ccn-header-user-logout").show();
    } else {
        $("#ccn-header-nav-home").show();
        $("#ccn-header-nav-calendar").hide();
        $("#ccn-header-nav-todo").hide();
        $("#ccn-header-nav-admin").hide();

        $("#ccn-header-user-login").show();
        $("#ccn-header-user-logout").hide();
    }
}

// bind language process and internal process function such as logout and expand menu
function ccn_headerNav_BindEvents() {
    // bind function
    $("#ccn-header-language > *").each(function(){
        $(this).click(function(){
            ccn_i18n_ChangeLanguage($(this).attr("language"));
            ccn_i18n_ApplyLanguage();
        });
    });

    // bind logout
    $("#ccn-header-user-logout").click(function() {
        if (ccn_api_common_logout()) {
            // ok, logout
            // jump into home page again
            window.location.href = '/web/home';
            return;
    
        } else ccn_messagebox_Show($.i18n.prop("ccn-js-fail-logout"));
    });

    // bind burger menu
    // copy from bulma website
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");

    });
}

