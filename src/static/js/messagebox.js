function ccn_messagebox_Insert() {
    $('body').append(ccn_template_messagebox.render());
}

function ccn_messagebox_Show(/*title,*/ info) {
    //$('#ccn-messagebox-title').text(title);
    $('#ccn-messagebox-body').text(info);

    $('#ccn-messagebox-modal').addClass('is-active');
}

function ccn_messagebox_BindEvent() {
    $('#ccn-messagebox-btnClose').click(ccn_messagebox_Hide);
    $('#ccn-messagebox-btnConfirm').click(ccn_messagebox_Hide);
}

function ccn_messagebox_Hide() {
    $('#ccn-messagebox-modal').removeClass('is-active');
}
