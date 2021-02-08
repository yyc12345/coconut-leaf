$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.login;

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

    // bind login event
    $("#ccn-login-form-login").click(ccn_login_startLogin);
});

function ccn_login_startLogin() {
    // disable all ui first
    $("#ccn-login-form-login").attr("disabled",true);
    $("#ccn-login-form-username").attr("disabled",true);
    $("#ccn-login-form-password").attr("disabled",true);

    // get form data
    username = $("#ccn-login-form-username").val();
    password = $("#ccn-login-form-password").val();

    /*
    // try get salt
    if (ccn_api_common_salt(username)) {
        // continue login
        if (ccn_api_common_login(username, password)) {
            // ok, logged
            // jump into home page again
            window.location.href = '/web/home';

        } else ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-login"));
    } else ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-login"));
    */
   if (ccn_api_common_webLogin(username, password)) {
        // ok, logged
        // jump into home page again
        window.location.href = '/web/home';
        return;

    } else ccn_messagebox_Show($.i18n.prop("ccn-i18n-js-fail-login"));

    // retore ui
    $("#ccn-login-form-login").removeAttr("disabled");
    $("#ccn-login-form-username").removeAttr("disabled");
    $("#ccn-login-form-password").removeAttr("disabled");
}
