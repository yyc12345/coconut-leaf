var ccn_i18n_i18nSupported = ['en-US', 'zh-CN'];
var ccn_i18n_currentLanguage = 'en-US';

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
        path: 'i18n/',
        mode: 'map',
        language: ccn_i18n_currentLanguage,
        callback: function() {
            //set usual block
            var cache = $(".ccn-i18n");
            cache.each(function() {
                $(this).html($.i18n.prop($(this).attr('name')));
            });

            //set unusual block
            //set title
            switch(ccn_pages_currentPage) {
                case ccn_pages_enumPages.home:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-home'))
                    break;
                case ccn_pages_enumPages.user:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-user'))
                    break;
                case ccn_pages_enumPages.userinfo:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-userinfo'))
                    break;
                case ccn_pages_enumPages.map:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-map'))
                    break;
                case ccn_pages_enumPages.mapinfo:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-mapinfo'))
                    break;
                case ccn_pages_enumPages.about:
                    $('#ccn-pageName').html($.i18n.prop('ccn-pageName-about'))
                    break;
            }
        }
    })
}
