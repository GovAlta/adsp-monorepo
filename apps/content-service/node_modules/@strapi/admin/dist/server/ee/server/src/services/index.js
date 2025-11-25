'use strict';

var auth = require('./auth.js');
var passport = require('./passport.js');
var role = require('./role.js');
var user = require('./user.js');
var metrics = require('./metrics.js');
var seatEnforcement = require('./seat-enforcement.js');
var persistTables = require('./persist-tables.js');

var services = {
    auth,
    passport,
    role,
    user,
    metrics,
    'seat-enforcement': seatEnforcement,
    'persist-tables': persistTables.default
};

module.exports = services;
//# sourceMappingURL=index.js.map
