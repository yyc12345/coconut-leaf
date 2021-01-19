import config
import sqlite3
import json
import utils
import threading

def SafeDatabaseOperation(func):
    def wrapper(self, *args, **kwargs):
        with self.mutex:
            # check database and acquire cursor
            try:
                self.check_database()
                self.cursor = self.db.cursor()
            except:
                self.cursor = None
                return (False, None)

            # do real data work
            try:
                result = (True, func(self, *args, **kwargs))
                self.cursor.close()
                self.cursor = None
                self.db.commit()
                return result
            except:
                self.cursor.close()
                self.cursor = None
                self.db.rollback()
                return (False, None)

    return wrapper

class CalendarDatabase(object):
    def __init__(self):
        self.db = None
        self.cursor = None
        self.mutex = threading.Lock()

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
            raise Exception('Databade is opened')

        # establish tables
        self.open()
        cursor = self.db.cursor()
        with open('sql/sqlite.sql', 'r', encoding='utf-8') as fsql:
            cursor.executescript(fsql.read())

        # finish init
        cursor.execute('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?);', (
            username,
            utils.ComputePasswordHash(password),
            1,
            utils.GenerateSalt(),
            utils.GenerateToken(username),
            0
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

    def get_username_from_token(self, token):
        self.cursor.execute('SELECT [ccn_name] FROM user WHERE [ccn_token] = ? AND [ccn_tokenExpireOn] > ?;',(
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
            self.cursor.execute('UPDATE user SET [ccn_token] = ?, [ccn_tokenExpireOn] = ? WHERE [ccn_name] = ?;', (
                token,
                utils.GetCurrentTimestamp() + 60 * 60 * 24 * 2, # add 2 day from now
                username
            ))
            return token
        else:
            # return empty string to indicate fail to login
            return ''

    @SafeDatabaseOperation
    def common_logout(self, token):
        username = self.get_username_from_token(cur, token)
        self.cursor.execute('UPDATE user SET [ccn_tokenExpireOn] = 0 WHERE [ccn_name] = ?;', (username, ))
        return None

    @SafeDatabaseOperation
    def common_tokenValid(self, token):
        # get user name have check the validation, don't do anything more.
        self.get_username_from_token(token)
        return result

    @SafeDatabaseOperation
    def common_isAdmin(self, token):
        username = self.get_username_from_token(token)
        self.cursor.execute('SELECT [ccn_isAdmin] FROM user WHERE [ccn_name] = ?;', (username, ))
        result = self.cursor.fetchone()[0] == 1
        return result

    @SafeDatabaseOperation
    def common_changePassword(self, token, newpassword):
        username = self.get_username_from_token(token)
        self.cursor.execute('UPDATE user SET [ccn_password] = ? WHERE [ccn_name] = ?;', (
            newpassword,
            username
        ))
        return None

    # =============================== calendar


    # =============================== collection


    # =============================== todo




    # =============================== admin


