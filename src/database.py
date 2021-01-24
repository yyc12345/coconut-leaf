import config
import sqlite3
import json
import utils
import threading
import logging

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
                if self.isFirstRun:
                    self.isFirstRun = False
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
        self.isFirstRun = True

    def open(self):
        if (self.is_database_valid()):
            raise Exception('Databade is opened')

        if config.CustomConfig['database-type'] == 'sqlite':
            self.db = sqlite3.connect(config.CustomConfig['database-config']['url'])
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
        return True if cache == 1 else False

    def tokenOper_get_username(self, token):
        self.cursor.execute('SELECT [ccn_user] FROM token WHERE [ccn_token] = ? AND [ccn_tokenExpireOn] > ?;',(
            token,
            utils.GetCurrentTimestamp()
        ))
        return self.cursor.fetchone()[0]
        
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
        return None

    @SafeDatabaseOperation
    def common_tokenValid(self, token):
        self.tokenOper_check_valid(token)
        return None

    @SafeDatabaseOperation
    def common_isAdmin(self, token):
        username = self.tokenOper_get_username(token)
        return self.tokenOper_is_admin(username)

    @SafeDatabaseOperation
    def common_changePassword(self, token, newpassword):
        username = self.tokenOper_get_username(token)
        self.cursor.execute('UPDATE user SET [ccn_password] = ? WHERE [ccn_name] = ?;', (
            newpassword,
            username
        ))
        return True

    # =============================== calendar


    # =============================== collection


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
        # check sync conflict
        self.cursor.execute('SELECT [ccn_uuid] FROM todo WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (
            uuid,
            lastChange
        ))
        if len(self.cursor.fetchall()) == 0:
            raise Exception()

        # update
        newLastChange = utils.GenerateUUID()
        self.cursor.execute('UPDATE todo SET [ccn_data] = ?, [ccn_lastChange] = ? WHERE [ccn_uuid] = ?;', (
            data,
            newLastChange,
            uuid
        ))
        return newLastChange

    @SafeDatabaseOperation
    def todo_delete(self, token, uuid, lastChange):
        # check valid token
        self.tokenOper_check_valid(token)
        # check sync conflict
        self.cursor.execute('SELECT [ccn_uuid] FROM todo WHERE [ccn_uuid] = ? AND [ccn_lastChange] = ?;', (
            uuid,
            lastChange
        ))
        if len(self.cursor.fetchall()) == 0:
            raise Exception()

        # delete
        self.cursor.execute('DELETE FROM todo WHERE [ccn_uuid] = ?;', (uuid, ))
        return None


    # =============================== admin


