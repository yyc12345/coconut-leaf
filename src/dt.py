import datetime
import time
import re
from functools import reduce
import utils

MonthDayCount = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

MIN_DATETIME = datetime.datetime(1950, 1, 1, 0, 0, 0, 0, tzinfo=datetime.timezone.utc)
MAX_DATETIME = datetime.datetime(2200, 1, 1, 0, 0, 0, 0, tzinfo=datetime.timezone.utc)
MIN_TIMESTAMP = int(MIN_DATETIME.timestamp() / 60)
MAX_TIMESTAMP = int(MAX_DATETIME.timestamp() / 60)
DAY1_SPAN = 60 * 24
DAY7_SPAN = 7 * DAY1_SPAN

def ResolveLoopStr(strl, starttime, tzoffset):
    # check no loop
    if strl == '':
        return starttime
    
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
    clientDate = datetime.datetime.fromtimestamp(starttime, UTCTimezone(tzoffset))
    isStrict = searchResult.group(1) == 'S'
    yearSpan = int(searchResult.group(2))

    newYear = clientYear = clientDate.year
    newMonth = clientMonth = clientDate.month
    newDay = clientDay = clientDate.day
    if clientMonth == 2 and clientDay == 29:
        if isStrict:
            realSpan = utils.LCM(yearSpan, 4)
            valCache = starttime
            timesCache = times - 1
            while valCache < MAX_TIMESTAMP and timesCache > 0:
                newYear += realSpan
                if not IsLeapYear(newYear):
                    continue
                valCache = starttime + DAY1_SPAN * (DaysCount(newYear, newMonth, newDay) - DaysCount(clientYear, clientMonth, clientDay))
                timesCache -= 1
        else:
            newYear = 0 if times == 1 else (times * yearSpan)
            if not IsLeapYear(newYear):
                newDay = 28     # migrate to 28
    else:
        # if times == 1, no extra datetime need to be added
        newYear += 0 if times == 1 else (times * yearSpan)

    val = starttime + DAY1_SPAN * (DaysCount(newYear, newMonth, newDay) - DaysCount(clientYear, clientMonth, clientDay))
    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

def LoopHandle_Month(searchResult, starttime, times, tzoffset):
    isStrict = searchResult.group(1) == 'S'
    loopType = searchResult.group(2)
    monthSpan = int(searchResult.group(3))

    # we should get original data in each method
    times -= 1
    clientDate = datetime.datetime.fromtimestamp(starttime, UTCTimezone(tzoffset))
    newYear = clientYear = clientDate.year
    newMonth = clientMonth = clientDate.month
    newDay = clientDay = clientDate.day
    # data struct
    # dayStatistics =
    # (dayForwards, dayBackwards, weeksForward, dayOfWeekForward, weeksBackwards, dayOfWeekBackward)
    dayStatistics = GetDayInMonth(clientYear, clientMonth, clientDay)

    if isStrict:
        if loopType == 'A':
            while times > 0:
                newMonth += 1
                if newMonth > 12:
                    newMonth = 1
                    newYear += 1
                maxDays = MonthDayCount[newMonth - 1] + (1 if newMonth == 2 and IsLeapYear(newYear) else 0)
                if dayStatistics[0] <= maxDays:
                    times -= 1
        elif loopType == 'B':
            while times > 0:
                newMonth += 1
                if newMonth > 12:
                    newMonth = 1
                    newYear += 1
                maxDays = MonthDayCount[newMonth - 1] + (1 if newMonth == 2 and IsLeapYear(newYear) else 0)
                if dayStatistics[1] <= maxDays:
                    times -= 1
        elif loopType == 'C':
            while times > 0:
                newMonth += 1
                if newMonth > 12:
                    newMonth = 1
                    newYear += 1
                monthStatistics = GetMonthWeekStatistics(newYear, newMonth)
                if dayStatistics[2] <= monthStatistics[dayStatistics[3]]:
                    times -= 1
        elif loopType == 'D':
            while times > 0:
                newMonth += 1
                if newMonth > 12:
                    newMonth = 1
                    newYear += 1
                monthStatistics = GetMonthWeekStatistics(newYear, newMonth)
                if dayStatistics[4] <= monthStatistics[dayStatistics[5]]:
                    times -= 1
    else:
        newMonth += times * monthSpan
        newYear += int(newMonth - 1 / 12)
        newMonth = (newMonth % 12) + 1
        newDay = MonthDayCount[newMonth - 1] + (1 if newMonth == 2 and IsLeapYear(newYear) else 0)

    val = starttime + DAY1_SPAN * (DaysCount(newYear, newMonth, newDay) - DaysCount(clientYear, clientMonth, clientDay))
    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

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

    val -= 1
    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

def LoopHandle_Day(searchResult, starttime, times, tzoffset):
    val = starttime + DAY1_SPAN * times * int(searchResult.group(1))
    val -= 1
    return val if val < MAX_TIMESTAMP else MAX_TIMESTAMP

precompiledLoopRules = (
    (re.compile(r'^Y([SR]{1})([1-9]\d*)$'), LoopHandle_Year),
    (re.compile(r'^M([SR]{1})([ABCD]{1})([1-9]\d*)$'), LoopHandle_Month),
    (re.compile(r'^W([TF]{7})([1-9]\d*)$'), LoopHandle_Week),
    (re.compile(r'^D([1-9]\d*)$'), LoopHandle_Day)
)

precompiledLoopStopRules = {
    'infinity': re.compile(r'^F$'),
    'datetime': re.compile(r'^D([1-9]\d*|0)$'),
    'times': re.compile(r'^T([1-9]\d*)$')
}

def LeapYearCountEx(endYear, includeThis = False, baseYear = 1, includeBase = True):
    if not includeThis:
        endYear -= 1
    if includeBase:
        baseYear -= 1

    endly = int(endYear / 4)
    endly -= int(endYear / 100)
    endly += int(endYear / 400)

    basely = int(baseYear / 4)
    basely -= int(baseYear / 100)
    basely += int(baseYear / 400)

    return (endly - basely)

def LeapYearCount(year):
    return LeapYearCountEx(year, False, 1, True)

def IsLeapYear(year):
    isLeap = False
    if year % 4 == 0:
        isLeap = True
    if year % 100 == 0:
        isLeap = False
    if year % 400 == 0:
        isLeap = True
    return isLeap

def DaysCount(year, month, day):
    ly = LeapYearCountEx(year, False, 1, True)
    days = 365 * (year - 1)
    days += ly

    for index in range(1, month, 1):
        days += MonthDayCount[index - 1]

    if (month > 2) and IsLeapYear(year):
        days += 1

    days += day - 1
    return days

def DayOfWeek(year, month, day):
    # as we know, 1/1/1900 is Monday.
    # via this method, we can got 1/1/1 is Monday
    # compute day span
    days=DaysCount(year, month, day)

    # return day of week (from 0 - 6, corresponding with python)
    return days % 7

def GetDayInMonth(year, month, day):
    days = MonthDayCount[month - 1] + (1 if (month == 2 and IsLeapYear(year)) else 0)
    firstDayOfWeek = DayOfWeek(year, month, 1)
    lastDayOfWeek = (firstDayOfWeek + days - 1) % 7
    dayOfWeek = (firstDayOfWeek + day - 1) % 7

    dayForwards = day
    dayBackwards = days - day + 1

    weeksForward = (dayForwards - 1) / 7
    weeksBackwards = (dayBackwards - 1) / 7

    dayOfWeekForward = (firstDayOfWeek + ((dayForwards - 1) % 7)) % 7
    # 7 don't change week
    # # just keep this is the positive number and prevent pretential minus number calc problem
    dayOfWeekBackward = (7 + lastDayOfWeek - ((dayBackwards - 1) % 7)) % 7

    return (dayForwards, dayBackwards, weeksForward, dayOfWeekForward, weeksBackwards, dayOfWeekBackward)

def GetMonthWeekStatistics(year, month):
    days = MonthDayCount[month - 1] + (1 if (month == 2 and IsLeapYear(year)) else 0)
    firstDayOfWeek = DayOfWeek(year, month, 1)
    lastDayOfWeek = (firstDayOfWeek + days - 1) % 7
 
    result = [4, 4, 4, 4, 4, 4, 4]
    remain = (days - 1) % 7
    week = firstDayOfWeek
    while remain > 0:
        result[week % 7] += 1
        week += 1
        remain -= 1

    return tuple(result)

class UTCTimezone(datetime.tzinfo):
    def __init__(self, offset = 0):
        self._offset = offset

    def utcoffset(self, dt):
        return datetime.timedelta(minutes=self._offset)

    def tzname(self, dt):
        return 'UTC {}'.format(self._offset)

    def dst(self, dt):
        return timedelta(0)