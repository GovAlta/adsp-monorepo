'use strict';

var homepage = require('./homepage.js');
var release = require('./release.js');
var releaseAction = require('./release-action.js');
var settings = require('./settings.js');

const controllers = {
    homepage,
    release,
    'release-action': releaseAction,
    settings
};

exports.controllers = controllers;
//# sourceMappingURL=index.js.map
