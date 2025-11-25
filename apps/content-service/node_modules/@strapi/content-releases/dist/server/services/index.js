'use strict';

var homepage = require('./homepage.js');
var release = require('./release.js');
var releaseAction = require('./release-action.js');
var validation = require('./validation.js');
var scheduling = require('./scheduling.js');
var settings = require('./settings.js');

const services = {
    homepage,
    release,
    'release-action': releaseAction,
    'release-validation': validation.default,
    scheduling,
    settings
};

exports.services = services;
//# sourceMappingURL=index.js.map
