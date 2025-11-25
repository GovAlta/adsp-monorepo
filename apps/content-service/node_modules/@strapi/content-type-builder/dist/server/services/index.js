'use strict';

var contentTypes = require('./content-types.js');
var components = require('./components.js');
var componentCategories = require('./component-categories.js');
var builder = require('./builder.js');
var apiHandler = require('./api-handler.js');
var schema = require('./schema.js');

var services = {
    'content-types': contentTypes,
    components,
    'component-categories': componentCategories,
    builder,
    'api-handler': apiHandler,
    schema
};

module.exports = services;
//# sourceMappingURL=index.js.map
