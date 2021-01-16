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

app = Flask(__name__)

render_static_resources = None

# =============================================database
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

# ============================================= static page route

@app.route('/', methods=['GET'])
def nospecHandle():
    return redirect(url_for('web_homeHandle'))

@app.route('/web/home', methods=['GET'])
def web_homeHandle():
    UpdateStaticResources()
    return render_template("home.html", **render_static_resources)

@app.route('/web/calendar', methods=['GET'])
def web_calendarHandle():
    UpdateStaticResources()
    return render_template("calendar.html", **render_static_resources)

@app.route('/web/todo', methods=['GET'])
def web_todoHandle():
    UpdateStaticResources()
    return render_template("todo.html", **render_static_resources)

@app.route('/web/admin', methods=['GET'])
def web_adminHandle():
    UpdateStaticResources()
    return render_template("admin.html", **render_static_resources)

# ============================================= query page route

# ================================ common

@app.route('/api/common/salt', methods=['POST'])
def api_common_saltHandle():
    pass

@app.route('/api/common/login', methods=['POST'])
def api_common_loginHandle():
    pass

@app.route('/api/common/logout', methods=['POST'])
def api_common_logoutHandle():
    pass

@app.route('/api/common/tokenValid', methods=['POST'])
def api_common_tokenValidHandle():
    pass

@app.route('/api/common/isAdmin', methods=['POST'])
def api_common_isAdminHandle():
    pass

@app.route('/api/common/changePassword', methods=['POST'])
def api_common_changePasswordHandle():
    pass

# ================================ calendar

@app.route('/api/calendar/getFull', methods=['POST'])
def api_calendar_getFullHandle():
    pass

@app.route('/api/calendar/getList', methods=['POST'])
def api_calendar_getListHandle():
    pass

@app.route('/api/calendar/getDetail', methods=['POST'])
def api_calendar_getDetailHandle():
    pass

@app.route('/api/calendar/update', methods=['POST'])
def api_calendar_updateHandle():
    pass

@app.route('/api/calendar/add', methods=['POST'])
def api_calendar_addHandle():
    pass

@app.route('/api/calendar/delete', methods=['POST'])
def api_calendar_deleteHandle():
    pass

# ================================ collection

@app.route('/api/collection/getOwn', methods=['POST'])
def api_collection_getOwnHandle():
    pass

@app.route('/api/collection/addOwn', methods=['POST'])
def api_collection_addOwnHandle():
    pass

@app.route('/api/collection/updateOwn', methods=['POST'])
def api_collection_updateOwnHandle():
    pass

@app.route('/api/collection/deleteOwn', methods=['POST'])
def api_collection_deleteOwnHandle():
    pass


@app.route('/api/collection/getSharing', methods=['POST'])
def api_collection_getSharingHandle():
    pass

@app.route('/api/collection/deleteSharing', methods=['POST'])
def api_collection_deleteSharingHandle():
    pass

@app.route('/api/collection/addSharing', methods=['POST'])
def api_collection_addSharingHandle():
    pass


@app.route('/api/collection/getShared', methods=['POST'])
def api_collection_getSharedHandle():
    pass


# ================================ todo

@app.route('/api/todo/getFull', methods=['POST'])
def api_todo_getFullHandle():
    pass

@app.route('/api/todo/getList', methods=['POST'])
def api_todo_getListHandle():
    pass

@app.route('/api/todo/getDetail', methods=['POST'])
def api_todo_getDetailHandle():
    pass

@app.route('/api/todo/add', methods=['POST'])
def api_todo_addHandle():
    pass

@app.route('/api/todo/update', methods=['POST'])
def api_todo_updateHandle():
    pass

@app.route('/api/todo/delete', methods=['POST'])
def api_todo_deleteHandle():
    pass

# ================================ admin

@app.route('/api/admin/get', methods=['POST'])
def api_admin_getHandle():
    pass

@app.route('/api/admin/add', methods=['POST'])
def api_admin_addHandle():
    pass

@app.route('/api/admin/update', methods=['POST'])
def api_admin_updateHandle():
    pass

@app.route('/api/admin/delete', methods=['POST'])
def api_admin_deleteHandle():
    pass

# =============================================main run

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

def run():
    app.run(port=config.CustomConfig['web']['port'])
    