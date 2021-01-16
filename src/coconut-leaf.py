import os
import sys
import getopt
import server
import config
import utils
import database

def GetUsernamePassword():
    print('What is the first username of this calendar system?')
    cache = input()
    while(not utils.IsValidUsername(cache)):
        print('Sorry, invalid data. Please try again.')
        cache = input()
    username = cache

    print("Input this user password:")
    cache = input()
    while(not utils.IsValidPassword(cache)):
        print('Sorry, invalid data. Please try again.')
        cache = input()
    password = cache

    return (username, password)

print('Coconut-leaf')
print('A self-host, multi-account calendar system.')
print('Project: https://github.com/yyc12345/coconut-leaf')
print('===================')

# process args
# preset init value
need_init = False
try:
    opts, args = getopt.getopt(sys.argv[1:], "hi")
except getopt.GetoptError:
    print('Wrong arguments!')
    print('python coconut-leaf.py [-i] [-h]')
    sys.exit(1)
for opt, arg in opts:
    if opt == '-h':
        print('python coconut-leaf.py [-i]')
        sys.exit(0)
    elif opt == '-i':
        need_init = True

if need_init:
    gotten_data = GetUsernamePassword()
    calendar = database.CalendarDatabase()
    calendar.init(*gotten_data)
    calendar.close()

print('Staring server...')
server.run()