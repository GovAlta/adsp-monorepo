'use strict';

var homepage = require('./homepage.js');
var release = require('./release.js');
var releaseAction = require('./release-action.js');
var settings = require('./settings.js');

const routes = {
    homepage,
    settings,
    release,
    'release-action': releaseAction
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
