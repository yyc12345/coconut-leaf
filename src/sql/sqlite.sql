CREATE TABLE user(
    [ccn_name] TEXT NOT NULL,
    [ccn_password] TEXT NOT NULL,
    [ccn_isAdmin] TINYINT NOT NULL CHECK(ccn_isAdmin = 1 OR ccn_isAdmin = 0),
    [ccn_salt] INTEGER NOT NULL,

    PRIMARY KEY (ccn_name)
);

CREATE TABLE token(
    [ccn_user] TEXT NOT NULL,
    [ccn_token] TEXT UNIQUE NOT NULL,
    [ccn_tokenExpireOn] BIGINT NOT NULL,

    FOREIGN KEY (ccn_user) REFERENCES user(ccn_name) ON DELETE CASCADE
);

CREATE TABLE collection(
    [ccn_uuid] TEXT NOT NULL,
    [ccn_name] TEXT NOT NULL,
    [ccn_user] TEXT NOT NULL,
    [ccn_lastChange] TEXT NOT NULL,

    PRIMARY KEY (ccn_uuid),
    FOREIGN KEY (ccn_user) REFERENCES user(ccn_name) ON DELETE CASCADE
);

CREATE TABLE share(
    [ccn_uuid] TEXT NOT NULL,
    [ccn_target] TEXT NOT NULL,

    FOREIGN KEY (ccn_uuid) REFERENCES collection(ccn_uuid) ON DELETE CASCADE
    FOREIGN KEY (ccn_target) REFERENCES user(ccn_name) ON DELETE CASCADE
);

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

CREATE TABLE todo(
    [ccn_uuid] TEXT NOT NULL,
    [ccn_belongTo] TEXT NOT NULL,

    [ccn_data] TEXT NOT NULL,
    [ccn_lastChange] TEXT NOT NULL,

    PRIMARY KEY (ccn_uuid),
    FOREIGN KEY (ccn_belongTo) REFERENCES user(ccn_name) ON DELETE CASCADE
);