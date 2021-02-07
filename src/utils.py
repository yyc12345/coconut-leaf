import hashlib
import random
import uuid
import time

ValidUsername = set(map(lambda x:chr(x), range(48, 58, 1))) | set(map(lambda x:chr(x), range(65, 91, 1))) | set(map(lambda x:chr(x), range(97, 123, 1)))
ValidPassword = set(map(lambda x:chr(x), range(33, 127, 1)))

def IsValidUsername(strl):
    return (len(set(strl) - ValidUsername) == 0)

def IsValidPassword(strl):
    return (len(set(strl) - ValidPassword) == 0)

def ComputePasswordHash(password):
    s = hashlib.sha256()
    s.update(password.encode('utf-8'))
    return s.hexdigest()

def GenerateUUID():
    return str(uuid.uuid1())

def GenerateToken(username):
    s = hashlib.sha256()
    s.update(username.encode('utf-8'))
    s.update(GenerateUUID().encode('utf-8'))
    return s.hexdigest()

def GenerateSalt():
    return random.randint(0, 6172748)

def ComputePasswordHashWithSalt(passwordHashed, salt):
    s = hashlib.sha256()
    s.update((passwordHashed + str(salt)).encode('utf-8'))
    return s.hexdigest()

def GetCurrentTimestamp():
    return int(time.time())

def GetTokenExpireOn():
    return GetCurrentTimestamp() + 60 * 60 * 24 * 2 # add 2 day from now

def Str2Bool(strl):
    return strl.lower() == 'true'

def GCD(a, b):
    return math.gcd(a, b)

def LCM(a, b):
    return a * b / GCD(a, b)
        