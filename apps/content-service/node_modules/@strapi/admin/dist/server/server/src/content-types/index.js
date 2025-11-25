'use strict';

var Permission = require('./Permission.js');
var User = require('./User.js');
var Role = require('./Role.js');
var apiToken = require('./api-token.js');
var apiTokenPermission = require('./api-token-permission.js');
var transferToken = require('./transfer-token.js');
var transferTokenPermission = require('./transfer-token-permission.js');
var session = require('./session.js');

var contentTypes = {
    permission: {
        schema: Permission
    },
    user: {
        schema: User
    },
    role: {
        schema: Role
    },
    'api-token': {
        schema: apiToken
    },
    'api-token-permission': {
        schema: apiTokenPermission
    },
    'transfer-token': {
        schema: transferToken
    },
    'transfer-token-permission': {
        schema: transferTokenPermission
    },
    session: {
        schema: session
    }
};

module.exports = contentTypes;
//# sourceMappingURL=index.js.map
