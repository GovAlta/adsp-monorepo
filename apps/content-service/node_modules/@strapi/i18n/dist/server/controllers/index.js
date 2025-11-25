'use strict';

var locales = require('./locales.js');
var contentTypes = require('./content-types.js');
var isoLocales = require('./iso-locales.js');

var controllers = {
    locales,
    'iso-locales': isoLocales,
    'content-types': contentTypes
};

module.exports = controllers;
//# sourceMappingURL=index.js.map
