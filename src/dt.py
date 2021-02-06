import datetime
import time
import re
from functools import reduce

MIN_TIMESTAMP = int(datetime.datetime(1950, 1, 1, 0, 0, 0, 0, tzinfo=datetime.timezone.utc).timestamp() / 60)
MAX_TIMESTAMP = int(datetime.datetime(2200, 1, 1, 0, 0, 0, 0, tzinfo=datetime.timezone.utc).timestamp() / 60)
DAY1_SPAN = 60 * 24
DAY7_SPAN = 7 * DAY1_SPAN
YEAR400_SPAN = DAY1_SPAN * 400 * 365

def ResolveLoopStr(strl, starttime, tzoffset):
    # check no loop
    if strl == '':
        return starttime + 1
    
    # try compute from loopStop
    (loopRules, loopStopRules) = strl.split('-')
    cache = precompiledLoopStopRules['infinity'].search(loopStopRules)
    if cache is not None:
        return MAX_TIMESTAMP
    cache = precompiledLoopStopRules['datetime'].search(loopStopRules)
    if cache is not None:
        return int(cache.group(1)) # group 1 is datetime
    cache = precompiledLoopStopRules['times'].search(loopStopRules)
    if cache is not None:
        loopTimes = cache   # for follwing calc
    else:
        raise Exception('Invalid loopStopRules')    # invalid rules

    for rules in precompiledLoopRules:
        cache = rules[0].search(loopRules)
        if cache is not None:
             return rules[1](cache, starttime, loopTimes, tzoffset)
    else:
        raise Exception('Invalid loopRules')


def LoopHandle_Year(searchResult, starttime, times, tzoffset):
    pass

def LoopHandle_Month(searchResult, starttime, times, tzoffset):
    pass

def LoopHandle_Week(searchResult, starttime, times, tzoffset):
    weekOccupied = tuple(map(lambda x: x == 'T', searchResult.group(1)))
    weekEventCount = reduce(lambda x, y: x + (1 if y else 0), weekOccupied, 0)
    if weekEventCount == 0:
        raise Exception('Invalid week format')

    weekSpan = int(searchResult.group(2))
    nowDayOfWeek = datetime.datetime.fromtimestamp(starttime, UTCTimezone(tzoffset)).weekday()
    if not weekOccupied[nowDayOfWeek]:
        times+=1    # if first event is not suit for week loop rules, add one more event to suit it.
    fullWeek = times / weekEventCount
    remainEvent = times % weekEventCount
    
    val = DAY7_SPAN * fullWeek * weekSpan
    if val > MAX_TIMESTAMP:
        return MAX_TIMESTAMP    # return now, to reduce calc usage

    while remainEvent != 0:
        val += DAY1_SPAN
        if weekOccupied[nowDayOfWeek % 7]:
            remainEvent -= 1
        nowDayOfWeek += 1

    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

def LoopHandle_Day(searchResult, starttime, times, tzoffset):
    val = starttime + DAY1_SPAN * times * int(searchResult.group(1))
    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

precompiledLoopRules = (
    (re.compile(r'^Y([RF]{1})([1-9]\d*)$'), LoopHandle_Year),
    (re.compile(r'^M([RF]{1})([ABCD]{1})([1-9]\d*)$'), LoopHandle_Month),
    (re.compile(r'^W([TF]{7})([1-9]\d*)$'), LoopHandle_Week),
    (re.compile(r'^D([1-9]\d*)$'), LoopHandle_Day)
)

precompiledLoopStopRules = {
    'infinity': re.compile(r'F')
    'datetime': re.compile(r'^D([1-9]\d*|0)$')
    'times': re.compile(r'^T([1-9]\d*)$')
}

class UTCTimezone(datetime.tzinfo):
    def __init__(self, offset = 0):
        self._offset = offset

    def utcoffset(self, dt):
        return datetime.timedelta(minutes=self._offset)

    def tzname(self, dt):
        return 'UTC {}'.format(self._offset)

    def dst(self, dt):
        return timedelta(0)