$(document).ready(function() {
    ccn_pages_currentPage = ccn_pages_enumPages.admin;
    
    // template process
    ccn_template_Load();
    
    // nav process
    cnn_headerNav_Insert();
    cnn_headerNav_BindEvents();
    cnn_headerNav_LoggedRefresh();

    // apply i18n
    ccn_i18n_ApplyLanguage();
});