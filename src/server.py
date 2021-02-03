from flask import Flask
from flask import g
from flask import render_template
from flask import url_for
from flask import request
from flask import abort
from flask import redirect

from functools import reduce
import json
import os

import config
import database
import utils

app = Flask(__name__)
calendar_db = database.CalendarDatabase()

# render_static_resources = None

# =============================================database
'''
def get_database():
    db = getattr(g, '_database', None)
    if db is None:
        db = database.CalendarDatabase()
        db.open()
    return db

@app.teardown_appcontext
def close_database(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
'''

# ============================================= static page route

@app.route('/', methods=['GET'])
def nospecHandle():
    return redirect(url_for('web_homeHandle'))

@app.route('/web/home', methods=['GET'])
def web_homeHandle():
    # UpdateStaticResources()
    return render_template("home.html")

@app.route('/web/calendar', methods=['GET'])
def web_calendarHandle():
    # UpdateStaticResources()
    return render_template("calendar.html")

@app.route('/web/todo', methods=['GET'])
def web_todoHandle():
    # UpdateStaticResources()
    return render_template("todo.html")

@app.route('/web/admin', methods=['GET'])
def web_adminHandle():
    # UpdateStaticResources()
    return render_template("admin.html")

@app.route('/web/login', methods=['GET'])
def web_loginHandle():
    # UpdateStaticResources()
    return render_template("login.html")

# ============================================= query page route

# ================================ common

@app.route('/api/common/salt', methods=['POST'])
def api_common_saltHandle():
    return SmartDbCaller(calendar_db.common_salt, 
    (('username', str, False), ))

@app.route('/api/common/login', methods=['POST'])
def api_common_loginHandle():
    return SmartDbCaller(calendar_db.common_login, 
    (('username', str, False), 
    ('password', str, False)))

@app.route('/api/common/webLogin', methods=['POST'])
def api_common_webLoginHandle():
    return SmartDbCaller(calendar_db.common_webLogin, 
    (('username', str, False), 
    ('password', str, False)))

@app.route('/api/common/logout', methods=['POST'])
def api_common_logoutHandle():
    return SmartDbCaller(calendar_db.common_logout, 
    (('token', str, False), ))

@app.route('/api/common/tokenValid', methods=['POST'])
def api_common_tokenValidHandle():
    return SmartDbCaller(calendar_db.common_tokenValid, 
    (('token', str, False), ))

@app.route('/api/common/isAdmin', methods=['POST'])
def api_common_isAdminHandle():
    return SmartDbCaller(calendar_db.common_isAdmin, 
    (('token', str, False), ))

@app.route('/api/common/changePassword', methods=['POST'])
def api_common_changePasswordHandle():
    return SmartDbCaller(calendar_db.common_changePassword, 
    (('token', str, False),
    ('password', str, False)))

# ================================ calendar

@app.route('/api/calendar/getFull', methods=['POST'])
def api_calendar_getFullHandle():
    return SmartDbCaller(calendar_db.calendar_getFull, 
    (('token', str, False),
    ('startDateTime', int, False),
    ('endDateTime', int, False)))

@app.route('/api/calendar/getList', methods=['POST'])
def api_calendar_getListHandle():
    return SmartDbCaller(calendar_db.calendar_getList, 
    (('token', str, False),
    ('startDateTime', int, False),
    ('endDateTime', int, False)))

@app.route('/api/calendar/getDetail', methods=['POST'])
def api_calendar_getDetailHandle():
    return SmartDbCaller(calendar_db.calendar_getDetail, 
    (('token', str, False),
    ('uuid', str, False)))

@app.route('/api/calendar/update', methods=['POST'])
def api_calendar_updateHandle():
    return SmartDbCaller(calendar_db.calendar_update, 
    (('token', str, False),
    ('uuid', str, False),
    ('belongTo', str, True),
    ('title', str, True),
    ('description', str, True),
    ('eventDateTimeStart', int, True),
    ('eventDateTimeEnd', int, True),
    ('loopRules', str, True),
    ('timezoneOffset', int, True),
    ('lastChange', str, False)))

@app.route('/api/calendar/add', methods=['POST'])
def api_calendar_addHandle():
    return SmartDbCaller(calendar_db.calendar_add, 
    (('token', str, False),
    ('belongTo', str, False),
    ('title', str, False),
    ('description', str, False),
    ('eventDateTimeStart', int, False),
    ('eventDateTimeEnd', int, False),
    ('loopRules', str, False),
    ('timezoneOffset', int, False),
    ('lastChange', str, False)))

@app.route('/api/calendar/delete', methods=['POST'])
def api_calendar_deleteHandle():
    return SmartDbCaller(calendar_db.calendar_delete, 
    (('token', str, False),
    ('uuid', str, False),
    ('lastChange', str, False)))

# ================================ collection

@app.route('/api/collection/getFullOwn', methods=['POST'])
def api_collection_getFullOwnHandle():
    return SmartDbCaller(calendar_db.collection_getFullOwn, 
    (('token', str, False), ))

@app.route('/api/collection/getListOwn', methods=['POST'])
def api_collection_getListOwnHandle():
    return SmartDbCaller(calendar_db.collection_getListlOwn, 
    (('token', str, False), ))

@app.route('/api/collection/getDetailOwn', methods=['POST'])
def api_collection_getDetailOwnHandle():
    return SmartDbCaller(calendar_db.collection_getDetailOwn, 
    (('token', str, False), 
    ('uuid', str, False)))

@app.route('/api/collection/addOwn', methods=['POST'])
def api_collection_addOwnHandle():
    return SmartDbCaller(calendar_db.collection_addOwn, 
    (('token', str, False), 
    ('name', str, False)))

@app.route('/api/collection/updateOwn', methods=['POST'])
def api_collection_updateOwnHandle():
    return SmartDbCaller(calendar_db.collection_updateOwn, 
    (('token', str, False), 
    ('uuid', str, False),
    ('name', str, False), 
    ('lastChange', str, False)))

@app.route('/api/collection/deleteOwn', methods=['POST'])
def api_collection_deleteOwnHandle():
    return SmartDbCaller(calendar_db.collection_deleteOwn, 
    (('token', str, False), 
    ('uuid', str, False),
    ('lastChange', str, False)))


@app.route('/api/collection/getSharing', methods=['POST'])
def api_collection_getSharingHandle():
    return SmartDbCaller(calendar_db.collection_getSharing, 
    (('token', str, False), 
    ('uuid', str, False)))

@app.route('/api/collection/deleteSharing', methods=['POST'])
def api_collection_deleteSharingHandle():
    return SmartDbCaller(calendar_db.collection_deleteSharing, 
    (('token', str, False), 
    ('uuid', str, False),
    ('target', str, False),
    ('lastChange', str, False)))

@app.route('/api/collection/addSharing', methods=['POST'])
def api_collection_addSharingHandle():
    return SmartDbCaller(calendar_db.collection_addSharing, 
    (('token', str, False), 
    ('uuid', str, False),
    ('target', str, False),
    ('lastChange', str, False)))


@app.route('/api/collection/getShared', methods=['POST'])
def api_collection_getSharedHandle():
    return SmartDbCaller(calendar_db.collection_getShared, 
    (('token', str, False), ))


# ================================ todo

@app.route('/api/todo/getFull', methods=['POST'])
def api_todo_getFullHandle():
    return SmartDbCaller(calendar_db.todo_getFull, 
    (('token', str, False), ))

@app.route('/api/todo/getList', methods=['POST'])
def api_todo_getListHandle():
    return SmartDbCaller(calendar_db.todo_getList, 
    (('token', str, False), ))

@app.route('/api/todo/getDetail', methods=['POST'])
def api_todo_getDetailHandle():
    return SmartDbCaller(calendar_db.todo_getDetail, 
    (('token', str, False), 
    ('uuid', str, False)))

@app.route('/api/todo/add', methods=['POST'])
def api_todo_addHandle():
    return SmartDbCaller(calendar_db.todo_add, 
    (('token', str, False), ))

@app.route('/api/todo/update', methods=['POST'])
def api_todo_updateHandle():
    return SmartDbCaller(calendar_db.todo_update, 
    (('token', str, False), 
    ('uuid', str, False), 
    ('data', str, False), 
    ('lastChange', str, False)))

@app.route('/api/todo/delete', methods=['POST'])
def api_todo_deleteHandle():
    return SmartDbCaller(calendar_db.todo_delete, 
    (('token', str, False), 
    ('uuid', str, False), 
    ('lastChange', str, False)))

# ================================ admin

@app.route('/api/admin/get', methods=['POST'])
def api_admin_getHandle():
    return SmartDbCaller(calendar_db.admin_get, 
    (('token', str, False), ))

@app.route('/api/admin/add', methods=['POST'])
def api_admin_addHandle():
    return SmartDbCaller(calendar_db.admin_add, 
    (('token', str, False), 
    ('username', str, False)))

@app.route('/api/admin/update', methods=['POST'])
def api_admin_updateHandle():
    return SmartDbCaller(calendar_db.admin_update, 
    (('token', str, False), 
    ('username', str, False),
    ('password', str, True),
    ('isAdmin', utils.Str2Bool, True)))

@app.route('/api/admin/delete', methods=['POST'])
def api_admin_deleteHandle():
    return SmartDbCaller(calendar_db.admin_delete, 
    (('token', str, False), 
    ('username', str, False)))

# =============================================main run

'''
def UpdateStaticResources():
    global render_static_resources
    if render_static_resources is not None:
        return

    render_static_resources = {
        'url_js_localStorageAssist': url_for('static', filename='js/localStorageAssist.js'),
        'url_js_i18n': url_for('static', filename='js/i18n.js'),
        'url_js_api': url_for('static', filename='js/api.js'),
        'url_js_headerNav': url_for('static', filename='js/headerNav.js'),

        'url_tmpl_headerNac': url_for('static', filename='tmpl/headerNav.tmpl'),

        'url_js_pageHome': url_for('static', filename='js/page/home.js')
    }
'''

def SmartDbCaller(dbMethod, paramTuple):
    result = (False, 'Invalid parameter', None)
    optCount = 0
    paramList = []
    optParamDict = {}
    # for each item, item[0] is field name. item[1] is type. item[2] is whether it is optional field
    for item in paramTuple:
        cache = request.form.get(item[0], default=None, type=item[1])
        if item[2]:
            # optional param
            if cache is not None:
                optParamDict[item[0]] = cache
            optCount += 1
        else:
            if cache is None:
                break
            paramList.append(cache)
    else:
        # at least one opt param
        if optCount == 0 or len(optParamDict) != 0:
            result = dbMethod(*paramList, **optParamDict)
    
    return ConstructResponseBody(result)

def ConstructResponseBody(returnedTuple):
    return {
        'success': returnedTuple[0],
        'error': returnedTuple[1],
        'data': returnedTuple[2]
    }

def run():
    calendar_db.open()
    app.run(port=config.CustomConfig['web']['port'])
    calendar_db.close()
    