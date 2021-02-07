import config
import sqlite3
import json
import utils
import threading
import logging
import dt

def SafeDatabaseOperation(func):
    def wrapper(self, *args, **kwargs):
        with self.mutex:
            # check database and acquire cursor
            try:
                self.check_database()
                self.cursor = self.db.cursor()
            except Exception as e:
                self.cursor = None
                if config.CustomConfig['debug']:
                    logging.exception(e)
                return (False, str(e), None)

            # do real data work
            try:
                currentTime = utils.GetCurrentTimestamp()
                if currentTime - self.latestClean > config.CustomConfig['auto-token-clean-duration']:
                    self.latestClean = currentTime
                    print('Cleaning outdated token...')
                    self.tokenOper_clean()

                result = (True, '', func(self, *args, **kwargs))
                self.cursor.close()
                self.cursor = None
                self.db.commit()
                return result
            except Exception as e:
                self.cursor.close()
                self.cursor = None
                self.db.rollback()
                if config.CustomConfig['debug']:
                    logging.exception(e)
                return (False, str(e), None)

    return wrapper

class CalendarDatabase(object):
    def __init__(self):
        self.db = None
        self.cursor = None
        self.mutex = threading.Lock()
        self.latestClean = 0

    def open(self):
        if (self.is_database_valid()):
            raise Exception('Databade is opened')

        if config.CustomConfig['database-type'] == 'sqlite':
            self.db = sqlite3.connect(config.CustomConfig['database-config']['url'], check_same_thread = False)
            self.db.execute('PRAGMA encoding = "UTF-8";')
            self.db.execute('PRAGMA foreign_keys = ON;')
        elif config.CustomConfig['database-type'] == 'mysql':
            raise Exception('Not implemented database')
        else:
            raise Exception('Unknow database type')

    def init(self, username, password):
        if (self.is_database_valid()):
            raise Exception('Database is opened')

        # establish tables
        self.open()
        cursor = self.db.cursor()
        with open('sql/sqlite.sql', 'r', encoding='utf-8') as fsql:
            cursor.executescript(fsql.read())

        # finish init
        cursor.execute('INSERT INTO user VALUES (?, ?, ?, ?);', (
            username,
            utils.ComputePasswordHash(password),
            1,
            utils.GenerateSalt()
        ))
        cursor.close()
        self.db.commit()

    def close(self):
        self.check_database()
        self.db.close()
        self.db = None

    def check_database(self):
        if (not self.is_database_valid()):
            raise Exception('Databade is None')

    def is_database_valid(self):
        return not (self.db == None)

    # ======================= token related internal operation
    def tokenOper_clean(self):
        # remove outdated token
        self.cursor.execute('DELETE FROM token WHERE [ccn_tokenExpireOn] <= ?',(utils.GetCurrentTimestamp(), ))

    def tokenOper_postpone_expireOn(self, token):
        self.cursor.execute('UPDATE token SET [ccn_tokenExpireOn] = ? WHERE [ccn_token] = ?;', (
            utils.GetTokenExpireOn(),
            token
        ))

    def tokenOper_check_valid(self, token):
        self.tokenOper_get_username(token)

    def tokenOper_is_admin(self, username):
        self.cursor.execute('SELECT [ccn_isAdmin] FROM user WHERE [ccn_name] = ?;',(username, ))
        cache = self.cursor.fetchone()[0]
        return cache == 1

    def tokenOper_get_username(self, token):
        self.cursor.execute('SELECT [ccn_user] FROM token WHERE [ccn_token] = ? AND [ccn_tokenExpireOn] > ?;',(
            token,
            utils.GetCurrentTimestamp()
        ))
        result = self.cursor.fetchone()[0]
        # need postpone expire on time
        self.tokenOper_postpone_expireOn(token)
        return result
        
    # =============================== # =============================== operation function
    # =============================== common
    
    @SafeDatabaseOperation
    def common_salt(self, username):
        salt = utils.GenerateSalt()
        self.cursor.execute('UPDATE user SET [ccn_salt] = ? WHERE [ccn_name] = ?;', (
            salt,
            username
        ))
        return salt

    @SafeDatabaseOperation
    def common_login(self, username, password):
        self.cursor.execute('SELECT [ccn_password], [ccn_salt] FROM user WHERE [ccn_name] = ?;', (username, ))
        (gotten_salt, gotten_password) = self.cursor.fetchone()
        
        if password == utils.ComputePasswordHashWithSalt(gotten_password, gotten_salt):
            token = utils.GenerateToken(username)
            self.cursor.execute('UPDATE user SET [ccn_salt] = ? WHERE [ccn_name] = ?;', (
                utils.GenerateSalt(), # regenerate a new slat to prevent re-login try
                username
            ))
            self.cursor.execute('INSERT INTO token VALUES (?, ?, ?);', (
                username,
                token,
                utils.GetTokenExpireOn(), # add 2 day from now
            ))
            return token
        else:
            # throw a exception to indicate fail to login
            raise Exception('Login authentication failed')

    @SafeDatabaseOperation
    def common_webLogin(self, username, password):
        self.cursor.execute('SELECT [ccn_name] FROM user WHERE [ccn_name] = ? AND [ccn_password] = ?;', (username, utils.ComputePasswordHash(password)))

        if len(self.cursor.fetchall()) != 0:
            token = utils.GenerateToken(username)
            self.cursor.execute('INSERT INTO token VALUES (?, ?, ?);', (
                username,
                token,
                utils.GetTokenExpireOn(), # add 2 day from now
            ))
            return token
        else:
            # throw a exception to indicate fail to login
            raise Exception('Login authentication failed')

    @SafeDatabaseOperation
    def common_logout(self, token):
        self.tokenOper_check_valid(token)
        self.cursor.execute('DELETE FROM token WHERE [ccn_token] = ?;', (token, ))
        return True

    @SafeDatabaseOperation
    def common_tokenValid(self, token):
        self.tokenOper_check_valid(token)
        return True

    @SafeDatabaseOperation
    def common_isAdmin(self, token):
        username = self.tokenOper_get_username(token)
        return self.tokenOper_is_admin(username)

    @SafeDatabaseOperation
    def common_changePassword(self, token, newpassword):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('UPDATE user SET [ccn_password] = ? WHERE [ccn_name] = ?;', (
            utils.ComputePasswordHash(newpassword),
            username
        ))
        return True

    # =============================== calendar
    @SafeDatabaseOperation
    def calendar_getFull(self, token, startDateTime, endDateTime):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT calendar.* FROM calendar INNER JOIN collection \
                ON collection.ccn_uuid = calendar.ccn_belongTo \
                WHERE (collection.ccn_user = ? AND calendar.ccn_loopDateTimeEnd >= ? AND calendar.ccn_loopDateTimeStart <= ?);', 
                (username, startDateTime, endDateTime))
        return self.cursor.fetchall()

    @SafeDatabaseOperation
    def calendar_getList(self, token, startDateTime, endDateTime):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT calendar.ccn_uuid FROM calendar INNER JOIN collection \
                ON collection.ccn_uuid = calendar.ccn_belongTo \
                WHERE (collection.ccn_user = ? AND calendar.ccn_loopDateTimeEnd >= ? AND calendar.ccn_loopDateTimeStart <= ?);', 
                (username, startDateTime, endDateTime))
        return tuple(map(lambda x: x[0], self.cursor.fetchall()))

    @SafeDatabaseOperation
    def calendar_getDetail(self, token, uuid):
        self.tokenOper_check_valid(token)
        self.cursor.execute('SELECT * FROM calendar WHERE [ccn_uuid] = ?;', (uuid, ))
        return self.cursor.fetchone()

    @SafeDatabaseOperation
    def calendar_update(self, token, uuid, lastChange, **optArgs):
        self.tokenOper_check_valid(token)

        # get prev data
        self.cursor.execute('SELECT * FROM calendar WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (uuid, lastChange))
        analyseData = self.cursor.fetchone()

        # construct update data
        lastupdate = utils.GenerateUUID()
        sqlList = [
            '[ccn_lastChange] = ?',
        ]
        argumentsList = [
            lastupdate,
        ]

        # analyse opt arg
        reAnalyseLoop = False

        cache = optArgs.get('belongTo', None)
        if cache is not None:
            sqlList.append('[ccn_belongTo] = ?')
            argumentsList.append(cache)
        cache = optArgs.get('title', None)
        if cache is not None:
            sqlList.append('[ccn_title] = ?')
            argumentsList.append(cache)
        cache = optArgs.get('description', None)
        if cache is not None:
            sqlList.append('[ccn_description] = ?')
            argumentsList.append(cache)
        cache = optArgs.get('eventDateTimeStart', None)
        if cache is not None:
            sqlList.append('[ccn_eventDateTimeStart] = ?')
            argumentsList.append(cache)
            reAnalyseLoop = True
            analyseData[5] = cache
        cache = optArgs.get('eventDateTimeEnd', None)
        if cache is not None:
            sqlList.append('[ccn_eventDateTimeEnd] = ?')
            argumentsList.append(cache)
        cache = optArgs.get('loopRules', None)
        if cache is not None:
            sqlList.append('[ccn_loopRules] = ?')
            argumentsList.append(cache)
            reAnalyseLoop = True
            analyseData[8] = cache
        cache = optArgs.get('timezoneOffset', None)
        if cache is not None:
            sqlList.append('[ccn_timezoneOffset] = ?')
            argumentsList.append(cache)
            reAnalyseLoop = True
            analyseData[7] = cache

        if reAnalyseLoop:
            # re-compute loop data and upload it into list
            sqlList.append('[ccn_loopDateTimeStart] = ?')
            argumentsList.append(analyseData[5])
            sqlList.append('[ccn_loopDateTimeEnd] = ?')
            argumentsList.append(dt.ResolveLoopStr(
                analyseData[8],
                analyseData[5],
                analyseData[7]
            ))

        # execute
        argumentsList.append(uuid)
        self.cursor.execute('UPDATE calendar SET {} WHERE [ccn_uuid] = ?;'.format(', '.join(sqlList)), 
        tuple(argumentsList))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to update due to no matched rows or too much rows.')
        return lastupdate

    @SafeDatabaseOperation
    def calendar_add(self, token, belongTo, title, description, eventDateTimeStart, eventDateTimeEnd, loopRules, timezoneOffset):
        self.tokenOper_check_valid(token)

        newuuid = utils.GenerateUUID()
        lastupdate = utils.GenerateUUID()

        # analyse loopRules and output following 2 fileds.
        loopDateTimeStart = eventDateTimeStart
        loopDateTimeEnd = dt.ResolveLoopStr(loopRules, eventDateTimeStart, timezoneOffset)

        self.cursor.execute('INSERT INTO calendar VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', 
        (newuuid,
        belongTo,
        title,
        description,
        lastupdate,
        eventDateTimeStart,
        eventDateTimeEnd,
        timezoneOffset,
        loopRules,
        loopDateTimeStart,
        loopDateTimeEnd))
        return newuuid

    @SafeDatabaseOperation
    def calendar_delete(self, token, uuid, lastChange):
        self.tokenOper_check_valid(token)
        self.cursor.execute('DELETE FROM calendar WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (uuid, lastChange))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')
        return True

    # =============================== collection
    @SafeDatabaseOperation
    def collection_getFullOwn(self, token):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT [ccn_uuid], [ccn_name], [ccn_lastChange] FROM collection WHERE [ccn_user] = ?;', (username, ))
        return self.cursor.fetchall()

    @SafeDatabaseOperation
    def collection_getListOwn(self, token):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT [ccn_uuid] FROM collection WHERE [ccn_user] = ?;', (username, ))
        return tuple(map(lambda x: x[0], self.cursor.fetchall()))

    @SafeDatabaseOperation
    def collection_getDetailOwn(self, token, uuid):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT [ccn_uuid], [ccn_name], [ccn_lastChange] FROM collection WHERE [ccn_user] = ? AND [ccn_uuid] = ?;', (username, uuid))
        return self.cursor.fetchone()

    @SafeDatabaseOperation
    def collection_addOwn(self, token, newname):
        username = self.tokenOper_get_username(token)
        newuuid = utils.GenerateUUID()
        lastupdate = utils.GenerateUUID()
        self.cursor.execute('INSERT INTO collection VALUES (?, ?, ?, ?);',
        (newuuid, newname, username, lastupdate))
        return newuuid

    @SafeDatabaseOperation
    def collection_updateOwn(self, token, uuid, newname, lastChange):
        self.tokenOper_check_valid(token)

        lastupdate = utils.GenerateUUID()
        self.cursor.execute('UPDATE collection SET [ccn_name] = ?, [ccn_lastChange] = ? WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (
            newname,
            lastupdate,
            uuid,
            lastChange
        ))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to update due to no matched rows or too much rows.')
        return lastupdate

    @SafeDatabaseOperation
    def collection_deleteOwn(self, token, uuid, lastChange):
        self.tokenOper_check_valid(token)

        self.cursor.execute('DELETE FROM collection WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (
            uuid,
            lastChange
        ))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')
        return True

    @SafeDatabaseOperation
    def collection_getSharing(self, token, uuid):
        self.tokenOper_check_valid(token)
        self.cursor.execute('SELECT [ccn_target] FROM share WHERE [ccn_uuid] = ?;', (uuid, ))
        return tuple(map(lambda x: x[0], self.cursor.fetchall()))

    @SafeDatabaseOperation
    def collection_deleteSharing(self, token, uuid, target, lastChange):
        self.tokenOper_check_valid(token)

        lastupdate = utils.GenerateUUID()
        self.cursor.execute('UPDATE collection SET [ccn_lastChange] = ?, WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (lastupdate, uuid, lastChange))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')

        self.cursor.execute('DELETE FROM share WHERE [ccn_uuid] = ? AND [ccn_target] = ?;', (uuid, target))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')

        return lastupdate

    @SafeDatabaseOperation
    def collection_addSharing(self, token, uuid, target, lastChange):
        self.tokenOper_check_valid(token)

        lastupdate = utils.GenerateUUID()
        self.cursor.execute('UPDATE collection SET [ccn_lastChange] = ? WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (lastupdate, uuid, lastChange))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')

        self.cursor.execute('SELECT * FROM share WHERE [ccn_uuid] = ? AND [ccn_target] = ?;', (uuid, target))
        if len(self.cursor.fetchall()) != 0:
            raise Exception('Fail to insert duplicated item.')
        self.cursor.execute('INSERT INTO share VALUES (?, ?);', (uuid, target))

        return lastupdate

    @SafeDatabaseOperation
    def collection_getShared(self, token):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT collection.ccn_uuid, collection.ccn_name, collection.ccn_user \
                FROM share INNER JOIN collection \
                ON share.ccn_uuid = collection.ccn_uuid \
                WHERE share.ccn_target = ?;', (username, ))
        return self.cursor.fetchall()

    # =============================== todo
    @SafeDatabaseOperation
    def todo_getFull(self, token):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT * FROM todo WHERE [ccn_belongTo] = ?;', (username, ))
        return self.cursor.fetchall()

    @SafeDatabaseOperation
    def todo_getList(self, token):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT [ccn_uuid] FROM todo WHERE [ccn_belongTo] = ?;', (username, ))
        return tuple(map(lambda x: x[0], self.cursor.fetchall()))

    @SafeDatabaseOperation
    def todo_getDetail(self, token, uuid):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('SELECT * FROM todo WHERE [ccn_belongTo] = ? AND [ccn_uuid] = ?;', (username, uuid))
        return self.cursor.fetchone()

    @SafeDatabaseOperation
    def todo_add(self, token):
        username = self.tokenOper_get_username(token)
        newuuid = utils.GenerateUUID()
        lastupdate = utils.GenerateUUID()
        returnedData = (
            newuuid,
            username,
            '',
            lastupdate,
        )
        self.cursor.execute('INSERT INTO todo VALUES (?, ?, ?, ?);', returnedData)
        return returnedData

    @SafeDatabaseOperation
    def todo_update(self, token, uuid, data, lastChange):
        # check valid token
        self.tokenOper_check_valid(token)

        # update
        newLastChange = utils.GenerateUUID()
        self.cursor.execute('UPDATE todo SET [ccn_data] = ?, [ccn_lastChange] = ? WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (
            data,
            newLastChange,
            uuid,
            lastChange
        ))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to update due to no matched rows or too much rows.')
        return newLastChange

    @SafeDatabaseOperation
    def todo_delete(self, token, uuid, lastChange):
        # check valid token
        self.tokenOper_check_valid(token)

        # delete
        self.cursor.execute('DELETE FROM todo WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (uuid, lastChange))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')
        return True


    # =============================== admin
    @SafeDatabaseOperation
    def admin_get(self, token):
        username = self.tokenOper_get_username(token)
        if not self.tokenOper_is_admin(username):
            raise Exception('Permission denied.')

        self.cursor.execute('SELECT [ccn_name], [ccn_isAdmin] FROM user;')
        return tuple(map(lambda x: (x[0], x[1] == 1), self.cursor.fetchall()))

    @SafeDatabaseOperation
    def admin_add(self, token, newname):
        username = self.tokenOper_get_username(token)
        if not self.tokenOper_is_admin(username):
            raise Exception('Permission denied.')

        newpassword = utils.ComputePasswordHash(utils.GenerateUUID())
        self.cursor.execute('INSERT INTO user VALUES (?, ?, ?, ?);', (
            newname,
            newpassword,
            0,
            utils.GenerateSalt()
        ))
        return (newname, False)

    @SafeDatabaseOperation
    def admin_update(self, token, _username, **optArgs):
        username = self.tokenOper_get_username(token)
        if not self.tokenOper_is_admin(username):
            raise Exception('Permission denied.')

        # construct data
        sqlList = []
        argumentsList = []

        # analyse opt arg
        cache = optArgs.get('password', None)
        if cache is not None:
            sqlList.append('[ccn_password] = ?')
            argumentsList.append(utils.ComputePasswordHash(cache))
        cache = optArgs.get('isAdmin', None)
        if cache is not None:
            sqlList.append('[ccn_isAdmin] = ?')
            argumentsList.append(1 if cache else 0)

        # execute
        argumentsList.append(_username)
        self.cursor.execute('UPDATE user SET {} WHERE [ccn_name] = ?;'.format(', '.join(sqlList)), 
        tuple(argumentsList))
        print(cache)
        print(tuple(argumentsList))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to update due to no matched rows or too much rows.')
        return True

    @SafeDatabaseOperation
    def admin_delete(self, token, username):
        _username = self.tokenOper_get_username(token)
        if not self.tokenOper_is_admin(_username):
            raise Exception('Permission denied.')

        # delete
        self.cursor.execute('DELETE FROM user WHERE [ccn_name] = ?;', (username, ))
        if self.cursor.rowcount != 1:
            raise Exception('Fail to delete due to no matched rows or too much rows.')
        return True

