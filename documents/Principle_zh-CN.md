# 日历原理

本文档记述此日历所用到的一些数据的注解，包含对一些字段，API，数据结构设计的解读，但不包含具体的日历算法。

## 杂项

日历的主要运算负载在循环事件的计算和处理上。在这方面，服务端负责计算循环事件的起始和结束时间。客户端利用服务端计算出的起始和结束时间，计算循环事件到底在哪些日子被循环了，进而进行渲染。

本日历系统基于UNIX时间戳进行处理。在设计上使用Int64进行存储以规避2038问题。同时，由于日历设计不需要精确到秒，因此本日历中与时间存储有关的时间戳使用标准UNIX时间戳/60来存储，构成粒度为分钟的时间戳。但是其余的，例如用户登录相关的时间戳，仍然为标准UNIX时间戳

本日历目前无条件限定最小时间为1950年1月1日，最大时间为2199年12月31日。

API在遇到当前接口产生错误时，使用外层结构来进行返回错误，例如token无效，应用程序错误，参数错误等。请注意捕获错误。如果没有错误，则表示data字段为有效数据。

## 数据库

### 同步容错

如果当前表中具有名为`ccn_lastChange`的字段，则标名该表具有同步容错功能，客户端上传的请求来操作该表时，会比对这个字段数值，如果相同才允许操作，并更新一个新数值返回给客户端。如果不相同，则表示客户端和服务端之间的数据不同步，需要重新同步各端数据。

在未来会增加一个或几个新的表来专门处理同步冲突并允许用户选择保留哪一个数据。

### 日历表

数据库方面，其余表都非常显而易见，只有calendar表需要详细讲述每个字段的功能。

```sql
CREATE TABLE calendar(
    [ccn_uuid] TEXT NOT NULL,
    [ccn_belongTo] TEXT NOT NULL,

    [ccn_title] TEXT NOT NULL,
    [ccn_description] TEXT NOT NULL,
    [ccn_lastChange] TEXT NOT NULL,

    [ccn_eventDateTimeStart] BIGINT NOT NULL,
    [ccn_eventDateTimeEnd] BIGINT NOT NULL,
    [ccn_timezoneOffset] INT NOT NULL,
    
    [ccn_loopRules] TEXT NOT NULL,
    [ccn_loopDateTimeStart] BIGINT NOT NULL,
    [ccn_loopDateTimeEnd] BIGINT NOT NULL,

    PRIMARY KEY (ccn_uuid),
    FOREIGN KEY (ccn_belongTo) REFERENCES collection(ccn_uuid) ON DELETE CASCADE
);
```

`ccn_title`是事件标题。`ccn_description`是事件描述，是一段JSON字典，其内容交由客户端自行解析，例如事件的标题颜色，设置提醒等，甚至包括ics文件标准中的一些基本用不到的功能，例如忙碌状态，地点，备注等，均交由此字段存储，交给客户端自行解析此字段决定如何使用这些数据。本日历不负责定义此处需要存储何种内容，但是定义其存储必须为JSON，为了方便不同的客户端进行解析，方便与ics文件之间相互转换。

`ccn_eventDateTimeStart`和`ccn_eventDateTimeEnd`，分别表示开始时间和结束时间。如果是循环事件，则表示此循环事件的第一个事件发生的时间。对于常用的点事件，或者全天事件，归于前者情况里面，通过设定开始和结束时间为一分钟和全天来解决。

`ccn_timezoneOffset`是客户端指定的对`ccn_eventDateTimeStart`和`ccn_eventDateTimeEnd`时区设定，这个值是传递给客户端和服务端本身进行计算用的。在服务器，2个事件时间仍然是UNIX时间戳。

`ccn_loopRules`是事件循环的规则，其格式详见后文的事件循环规则字符串章节。

`ccn_loopDateTimeStart`和`ccn_loopDateTimeEnd`是事件循环的时间，同时也被用于检索符合条件的事件返回给客户端。因此，对于非循环事件，其数值与`ccn_eventDateTimeStart`和`ccn_eventDateTimeEnd`保持一致。对于循环事件，则表示循环事件的循环的开始和结束时间。通常来说，`ccn_loopDateTimeStart`和`ccn_eventDateTimeStart`是一样的，无论是循环还是非循环事件。循环结束时间有3种类型，如果是无限循环，则将结束时间设置为Int64最大值。如果是指定时间，则设置成指定时间当天的最后一秒。如果是指定次数，则由算法算出最后时间。

需要注意的是，`ccn_loopDateTimeStart`和`ccn_loopDateTimeEnd`描述的是一段区间，一段包含该循环事件所有事件的开始时间的区间，但不一定包含所有结束时间。如下图所示：

```
  Event loop span

  +-----------------------------------------------------------------------+
  |                                                                       |
  |                                                                       |

     +---------------------+       +----------------------+           +------------------------+
     |Event 1              |       |Event 2               |           |Event 3                 |
     +---------------------+       +----------------------+           +------------------------+
+----------------------------------------------------------------------------------------------------> Time line
                                                                      |                        |
                                                                      |                        |
                                                                      v                        v

                                                                      Event start              Event end

```

## API

所有API均为POST请求  
理论上，所有更新操作（名字里有update的），除去必要的鉴别字段外，其余字段均为可选字段，可选字段只需要提供至少一个即可。但一些可选字段只有1条的，就没有可选字段。

### Common类

Common类下的为通用请求接口，一般与用户状态等相关  
登录有两种方式，一种是走加盐密码的通常登录，也就是执行salt和login。另一种是直接传输明文登录，通常是用于网页这种脚本语言太垃圾不适合计算HASH的场合，请求发到webLogin。

#### salt

请求地址：`/api/common/salt`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|username|string|需要获取盐的用户名|

返回参数：一个int，表征盐

#### login

请求地址：`/api/common/login`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|username|string|需要登录的用户名|
|password|string|加盐密码，计算方法是先将密码求SHA256并16进制输出小写，再与盐的字符串形式拼接，然后整体做SHA256输出16进制小写|

返回参数：一个string，作为token由客户端保存，在之后的请求中用于鉴权

此请求与上面的盐获取请求配套使用，用于通常意义下的客户端登录。

#### webLogin

请求地址：`/api/common/webLogin`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|username|string|需要登陆的用户名|
|password|string|明文密码|

返回参数：一个string，作为token由客户端保存，在之后的请求中用于鉴权

此请求设计用于Web端进行登录，其安全性由HTTPS保证。

#### logout

请求地址：`/api/common/logout`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|要退出用户的一个token，即销毁此token|

返回参数：一个bool，表示是否退出登录

#### tokenValid

请求地址：`/api/common/tokenValid`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|待检测的token|

返回参数：一个bool，表示是否有效

### Calendar类

Calendar类下的为日历请求接口  
日历事件请求有两种，一种是设计给网页使用的getFull，一次性获取所有信息。另一种是为客户端同步设计的，先用getList获取符合条件的事件的uuid和lastChange，然后与本地比对，然后通过getDetail与服务器进行同步，这样可以节约掉一部分没有修改的事件的同步成本。

#### getFull

请求地址：`/api/calendar/getFull`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|startDateTime|int|事件开始时间|
|endDateTime|int|事件结束事件|

返回参数：一个json，为从calendar数据库中原样select出数据的数组。没有符合条件的则返回空数组。

#### getList

请求地址：`/api/calendar/getList`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|startDatetime|int|事件开始时间|
|endDatetime|int|事件结束事件|

返回参数：一个json，返回符合条件的calendar数据库中的uuid字段组成的数组。没有符合条件的则返回空数组。

#### getDetail

请求地址：`/api/calendar/getDetail`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要获取详细信息的事件的uuid|

返回参数：一个json对象，为给定uuid对象的数据库条目原样复制。没有符合条件的则返回null。

#### update

请求地址：`/api/calendar/update`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|要修改条目的uuid|
|belongTo|string|事件所属collection的uuid|
|title|string|事件标题|
|description|string|事件描述|
|eventDateTimeStart|int|事件开始时间|
|eventDateTimeEnd|int|事件结束时间|
|loopRules|string|事件循环规则|
|timezoneOffset|int|此事件的本地时间与UTC时间之间的差值，使用本程序指定的粒度为分钟的时间差|
|lastChange|string|用于同步验证|

返回参数：新的lastChange，用以更新本地缓存

除去token，uuid和lastChange这3项用来鉴别的条目外，其余的条目均为可选项，提供则更新，不提供则不更新。

#### add

请求地址：`/api/calendar/add`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|belongTo|string|事件所属collection的uuid|
|title|string|事件标题|
|description|string|事件描述|
|eventDateTimeStart|int|事件开始时间|
|eventDateTimeEnd|int|事件结束时间|
|loopRules|string|事件循环规则|
|timezoneOffset|int|此事件的本地时间与UTC时间之间的差值，使用本程序指定的粒度为分钟的时间差|

返回参数：新事件的uuid，用以本地更新

#### delete

请求地址：`/api/calendar/delete`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|要删除条目的uuid|
|lastChange|string|用于同步验证|

返回参数：一个bool，指示是否删除成功。

### Collection类

Collection类下的为日历集合请求接口  
尾缀为Own的为对自己拥有集合的操作，尾缀为Sharing的表示对自己拥有的某个集合的分享人员进行操作，尾缀为Shared的表示对由他人分享的日历集合的操作。  
其中Own结尾的get请求与日历事件获取请求相似，也有两种，一种是设计给网页使用的getFull。另一种是为客户端同步设计的getList和getDetail。  
需要注意的是，在数据表中这3部分由2个表描述，collection和share，在进行Sharing结尾的操作时（也就是操作share表），同时也会更新其在collection对应条目的lastChange。因此share表里没有lastChange而全部lastChange都在collection表里。  

#### getFullOwn

请求地址：`/api/collection/getFullOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，返回collection数据表中除去ccn_user字段的符合条件的条目组合成的数组

#### getListOwn

请求地址：`/api/collection/getListOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，返回collection数据表中符合条件的条目的uuid组合成的数组

#### getDetailOwn

请求地址：`/api/collection/getDetailOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要获取集合的uuid|

返回参数：一个json，返回collection数据表中对应uuid的除去ccn_user字段的条目。没有符合条件的则返回null。

#### addOwn

请求地址：`/api/collection/addOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|name|string|新集合的名称|

返回参数：新创建集合的uuid

#### updateOwn

请求地址：`/api/collection/updateOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要修改集合的uuid|
|name|string|集合的新名称|
|lastChange|string|用于同步验证|

返回参数：一个新的lastChange，用于客户端更新

#### deleteOwn

请求地址：`/api/collection/deleteOwn`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要删除集合的uuid|
|lastChange|string|用于同步验证|

返回参数：一个bool，表示是否删除成功

#### getSharing

请求地址：`/api/collection/getSharing`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|用于获取的collection的uuid|

返回参数：一个json，返回share数据表中符合条件的条目的ccn_target列组合成的数组

#### deleteSharing

请求地址：`/api/collection/deleteSharing`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要删除的相关集合的uuid|
|target|string|需要删除的用户名|
|lastChange|string|用于同步验证|

返回参数：一个新的lastChange，用于客户端更新

#### addSharing

请求地址：`/api/collection/addSharing`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|需要添加的相关集合的uuid|
|target|string|需要添加的用户名|
|lastChange|string|用于同步验证|

返回参数：一个新的lastChange，用于客户端更新

#### getShared

请求地址：`/api/collection/getShared`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，返回被共享给自己的日历集合在collection数据表中的对应条目除去lastChange列的数组

### Todo类

Todo类下的为待办事项请求接口  
待办请求与日历事件请求相似，也有两种，一种是设计给网页使用的getFull。另一种是为客户端同步设计的getList和getDetail。

#### getFull

请求地址：`/api/todo/getFull`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，获取todo数据表中符合自己的条目的数组输出

#### getList

请求地址：`/api/todo/getList`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，获取todo数据表中符合自己的条目的uuid字段的数组输出

#### getDetail

请求地址：`/api/todo/getDetail`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|待获取条目的uuid字段|

返回参数：一个json，指定uuid条目的数据库条目的输出，不存在则输出null

#### add

请求地址：`/api/todo/add`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：新添加条目的uuid

#### update

请求地址：`/api/todo/update`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|待修改条目的uuid|
|data|string|新的数据|
|lastChange|string|用于同步验证|

返回参数：新的lastChange用于客户端同步

#### delete

请求地址：`/api/todo/delete`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|uuid|string|待删除条目的uuid|
|lastChange|string|用于同步验证|

返回参数：一个bool，用于表明是否删除成功

### Admin类

Admin类下的为管理员请求接口  
目前管理员接口只能对用户列表进行操作，因此请求的名字也没有后缀。  
Admin类的操作需要管理员权限的token，如果不具有权限，服务端会返回错误，是否具有管理员权限可以通过common类里面的接口由客户端查询，避免不必要的错误返回。  
Admin类的操作不涉及任何客户端存储，因此不需要lastChange来保护。

#### get

请求地址：`/api/admin/get`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个json，返回当前用户列表，即返回user表中的name和isAdmin字段组成的数组。需要注意的是，isAdmin会转换成bool再传输。

#### add

请求地址：`/api/admin/add`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|username|string|新的用户名|

返回参数：一个json，返回新建用户的对应条目，与get接口返回字段一致。创建成功的用户具有一个随机的密码，并且默认非管理员。创建失败返回null

#### update

请求地址：`/api/admin/update`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|username|string|用户名，此处仅仅是确认用户名，用户名是不能修改的|
|password|string|新的明文密码|
|isAdmin|bool|是否是管理员|

返回参数：一个bool表示是否修改成功

除去token，username这2项用来鉴别的条目外，其余的条目均为可选项，提供则更新，不提供则不更新。

#### delete

请求地址：`/api/admin/delete`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|username|string|用户名|

返回参数：一个bool表示是否删除成功

### Profile类

Admin类下的为当前用户一些个人属性的请求接口  
Profile类的操作不涉及任何客户端存储，因此不需要lastChange来保护。

#### isAdmin

请求地址：`/api/profile/isAdmin`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于管理员鉴别的token|

返回参数：一个bool，表示是否是管理员

#### changePassword

请求地址：`/api/profile/changePassword`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|password|string|新的明文密码|

返回参数：一个bool，表示是否修改成功

此请求的安全性由HTTPS保证。

#### getToken

请求地址：`/api/profile/getToken`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|

返回参数：一个JSON列表，为token表中符合当前提起请求的用户的所有token的条目

#### deleteToken

请求地址：`/api/profile/deleteToken`

请求参数：

|参数名|参数类型|参数解释|
|:---|:---|:---|
|token|string|用于用户鉴权的字符串|
|deleteToken|string|需要被强制下线的token|

返回参数：一个bool，表示是否下线成功

## 事件循环规则字符串

事件循环规则字符串 是一串用于描述当前事件循环规则的字符串，通过解析字符串可以计算出整个时间序列。本字符串借鉴了ics设计，但与ics设计毫无相似之处。

一个事件循环规则字符串的格式是`[rules]-[stop]`，其中，`[rules]`是循环规则。而`[stop]`是循环停止规则。

### 循环规则

循环规则中，例如每年循环，究竟循环哪一天，每月循环，`x`和`y`的数值为多少，则根据向服务器请求的事件开始时间戳和时区相对偏移来自动计算。

#### 按年

格式：`Y[S|R][span]`

每间隔`[span]`年在同样的月份和日期进行循环。`[S|R]`则表示在严格模式（Strict mode）和粗略模式（Rough mode）中的选择。  
假设在某个闰年，在2月29日设置3年循环一次，若选择严格模式，则实际上是12年循环一次（不考虑400年非闰），也就是不存在的日子则无视。而选择粗略模式，则将会在不存在的日子将事件设置在2月28日。

#### 按月

按月有4种格式

* 每月第`x`天：`M[S|R]A[span]`
* 每月倒数第`x`天：`M[S|R]B[span]`
* 每月第`x`个星期`y`：`M[S|R]C[span]`
* 每月倒数第`x`个星期`y`：`M[S|R]D[span]`

`[span]`表示每隔多少个月处理一次此类事件。 需要注意相关数字的钳制，此种类型的事件循环也是算力消耗最大的。  
`[S|R]`则表示在严格模式（Strict mode）和粗略模式（Rough mode）中的选择。  
同理，使用严格模式，对于不存在的日子即视为不存在。若选择粗略模式，将会按照可能的情况，将事件放在一个月的开始或结束，或者一个月开始或结束的某个星期。

#### 按周

格式：`W[T|F][T|F][T|F][T|F][T|F][T|F][T|F][span]`

`[span]`表示每隔多少个周处理一次此类事件。`[T|F]`表示从T和F中选择一个写入，共7个，表示从星期一到星期日是否循环这个事件。

#### 按日

格式：`D[span]`

每间隔`[span]`天进行循环。

### 循环停止规则

#### 永远

格式：`F`

表示这个事件永远持续下去

#### 指定时间

格式：`D[timestamp]`

在指定时间停止下来，实际上就是手动指定了`ccn_loopDateTimeEnd`。`[timestamp]`是结束时间的UNIX时间戳。

#### 指定次数

格式：`T[times]`

在指定次数后停止下来。`[times]`是次数，为非0正整数。

