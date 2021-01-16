function cnn_headerNav_Insert() {
    $.ajax({
        url: $("#jsrender-tmpl-headerNav").attr('src'),
        type: "GET",
        success: function (data) {
            var tmpl = $.templates(data);
            $('body').prepend(tmpl.render());
        }
    });
}

