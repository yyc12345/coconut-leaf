import config
import sqlite3
import json

class CalendarDatabase(object):
    def __init__(self):
        self.db = None

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

        self.open()
        with open('sql/sqlite.sql', 'r', encoding='utf-8') as fsql:
            cursor = self.db.cursor()
            cursor.executescript(fsql.read())
            cursor.close()
            self.db.commit()

        #todo: finish init
        

    def close(self):
        self.check_database()
        self.db.close()
        self.db = None

    def check_database(self):
        if (not self.is_database_valid()):
            raise Exception('Databade is None')

    def is_database_valid(self):
        return not (self.db == None)

    # operation function
    def login_step1(self, username):
        self.check_database()

    def login_step2(self, username, password):
        self.check_database()
