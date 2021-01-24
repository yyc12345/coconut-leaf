$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.login;
    
    // template process
    ccn_template_Load();
    
    // nav process
    cnn_headerNav_Insert();
    cnn_headerNav_BindEvents();
    cnn_headerNav_LoggedRefresh();

    // bind login event
    $("#ccn-login-form-login").click(ccn_login_startLogin);

    // apply i18n
    ccn_i18n_ApplyLanguage();
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
    if (cnn_api_common_salt(username)) {
        // continue login
        if (cnn_api_common_login(username, password)) {
            // ok, logged
            // jump into home page again
            window.location.href = '/web/home';

        } else alert($.i18n.prop("ccn-js-failToLogin"));
    } else alert($.i18n.prop("ccn-js-failToLogin"));
    */
   if (cnn_api_common_webLogin(username, password)) {
        // ok, logged
        // jump into home page again
        window.location.href = '/web/home';
        return;

    } else alert($.i18n.prop("ccn-js-failToLogin"));

    // retore ui
    $("#ccn-login-form-login").removeAttr("disabled");
    $("#ccn-login-form-username").removeAttr("disabled");
    $("#ccn-login-form-password").removeAttr("disabled");
}
