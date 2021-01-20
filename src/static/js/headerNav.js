function cnn_headerNav_Insert() {
    $.ajax({
        url: $("#jsrender-tmpl-headerNav").attr('src'),
        type: "GET",
        async: false,
        success: function (data) {
            var tmpl = $.templates(data);
            $('body').prepend(tmpl.render());
        }
    });
}

function cnn_headerNav_LoggedRefresh() {
    if (cnn_api_common_tokenValid()) {
        // logged, show all nav button and logout button
        $("#cnn-header-nav-home").show();
        $("#cnn-header-nav-calendar").show();
        $("#cnn-header-nav-todo").show();
        $("#cnn-header-nav-admin").show();

        $("#cnn-header-user-login").hide();
        $("#cnn-header-user-logout").show();
    } else {
        $("#cnn-header-nav-home").show();
        $("#cnn-header-nav-calendar").hide();
        $("#cnn-header-nav-todo").hide();
        $("#cnn-header-nav-admin").hide();

        $("#cnn-header-user-login").show();
        $("#cnn-header-user-logout").hide();
    }
}

// bind language process and internal process function such as logout and expand menu
function cnn_headerNav_BindEvents() {
    // bind function
    $("#cnn-header-language > *").each(function(){
        $(this).click(function(){
            ccn_i18n_ChangeLanguage($(this).attr("language"));
            ccn_i18n_ApplyLanguage();
        });
    });

    // bind logout
    $("#cnn-header-user-logout").click(function() {
        if (cnn_api_common_logout()) {
            // ok, logout
            // jump into home page again
            window.location.href = '/web/home';
            return;
    
        } else alert($.i18n.prop("ccn-js-failToLogout"));
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

