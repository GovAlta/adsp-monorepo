'use strict';

var auth = require('./auth.js');
var user = require('./user.js');
var role = require('./role.js');
var passport = require('./passport.js');
var metrics = require('./metrics.js');
var encryption = require('./encryption.js');
var token = require('./token.js');
var permission = require('./permission.js');
var contentType = require('./content-type.js');
var constants = require('./constants.js');
var condition = require('./condition.js');
var action = require('./action.js');
var apiToken = require('./api-token.js');
var index = require('./transfer/index.js');
var projectSettings = require('./project-settings.js');
var homepage = require('./homepage.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

var constants__namespace = /*#__PURE__*/_interopNamespaceDefaultOnly(constants);

// NOTE: Make sure to use default export for services overwritten in EE
// TODO: TS - Export services one by one as this export is cjs
var services = {
    auth,
    user,
    role,
    passport,
    token,
    permission,
    metrics,
    'content-type': contentType,
    constants: constants__namespace,
    condition,
    action,
    'api-token': apiToken,
    transfer: index,
    'project-settings': projectSettings,
    encryption,
    homepage: homepage.homepageService
};

module.exports = services;
//# sourceMappingURL=index.js.map
