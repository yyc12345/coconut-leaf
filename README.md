# coconut-leaf

A self-host, multi-account calendar system.

## Warning

This project still work in progress. Because this project need a massive refactor now.  
If you want to check out the first version which can fufill basic usage, please switch to `v1-maintain` branch. In `main` branch, I am refactoring v1 and it will be updated to v2 in future.  
The first version of this project have too much C-style JavaScript. It is too complicated to maintain and cannot add any other new features. Therefore, it needs to be fully refactored using ES6 and some modern JavaScript tools. It will come soon.

## Features & shortcomings

### Features

* Basic calendar(valid range from 1970 to 2200)
* Simple event system(including summary, color and etc)
* Simple account system and share system
* An looping event system.

### Shortcomings

* No extra properties for event(including location, busy status and etc. All of them can be written in summary property and extirely useless for myself. There are no plan to implement these in future.)
* No alarm system(should be implemented in frontend in future?)

