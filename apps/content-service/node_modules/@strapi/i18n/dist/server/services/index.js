'use strict';

var permissions = require('./permissions.js');
var metrics = require('./metrics.js');
var localizations = require('./localizations.js');
var locales = require('./locales.js');
var isoLocales = require('./iso-locales.js');
var contentTypes = require('./content-types.js');
var index = require('./sanitize/index.js');

var services = {
    permissions,
    metrics,
    localizations,
    locales,
    sanitize: index,
    'iso-locales': isoLocales,
    'content-types': contentTypes
};

module.exports = services;
//# sourceMappingURL=index.js.map
