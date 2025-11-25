'use strict';

var builder = require('./builder.js');
var componentCategories = require('./component-categories.js');
var components = require('./components.js');
var contentTypes = require('./content-types.js');
var schema = require('./schema.js');

const exportObject = {
    builder,
    'component-categories': componentCategories,
    components,
    'content-types': contentTypes,
    schema
};

module.exports = exportObject;
//# sourceMappingURL=index.js.map
