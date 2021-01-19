var ccn_i18n_i18nSupported = ['en-US', 'zh-CN'];
var ccn_i18n_currentLanguage = 'en-US';
var ccn_pages_enumPages = {
    home : 0,
    calendar: 1,
    todo: 2,
    admin: 3,
    login: 4
};
var ccn_pages_currentPage = ccn_pages_enumPages.home;

// judge current language
ccn_i18n_currentLanguage = ccn_localstorageAssist_Get('ccn-i18n', 'en-US');
if (ccn_i18n_i18nSupported.indexOf(ccn_i18n_currentLanguage) == -1){
    ccn_localstorageAssist_Set('ccn-i18n', 'en-US');
    ccn_i18n_currentLanguage = 'en-US';
}

function ccn_i18n_ChangeLanguage(newLang) {
    if (ccn_i18n_i18nSupported.indexOf(newLang) == -1) return false;
    ccn_i18n_currentLanguage = newLang;
    ccn_localstorageAssist_Set('ccn-i18n', newLang);
    return true;
}

function ccn_i18n_ApplyLanguage() {
    $.i18n.properties({
        name: 'strings_' + ccn_i18n_currentLanguage,
        path: '/static/i18n/',
        encoding: 'utf-8',
        mode: 'map',
        async: true,
        cache: false,
        language: ccn_i18n_currentLanguage,
        callback: function() {
            //set usual block
            var cache = $(".ccn-i18n");
            cache.each(function() {
                $(this).html($.i18n.prop($(this).attr('i18n-name')));
            });

            //set unusual block
            //set title
            switch(ccn_pages_currentPage) {
                case ccn_pages_enumPages.home:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-home'))
                    break;
                case ccn_pages_enumPages.calendar:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-calendar'))
                    break;
                case ccn_pages_enumPages.todo:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-todo'))
                    break;
                case ccn_pages_enumPages.admin:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-admin'))
                    break;
                case ccn_pages_enumPages.login:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-login'))
                    break;
            }
        }
    });
}
