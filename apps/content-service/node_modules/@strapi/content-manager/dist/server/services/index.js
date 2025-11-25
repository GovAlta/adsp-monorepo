'use strict';

var components = require('./components.js');
var contentTypes = require('./content-types.js');
var dataMapper = require('./data-mapper.js');
var fieldSizes = require('./field-sizes.js');
var metrics = require('./metrics.js');
var permissionChecker = require('./permission-checker.js');
var permission = require('./permission.js');
var populateBuilder = require('./populate-builder.js');
var uid = require('./uid.js');
var index = require('../history/index.js');
var index$1 = require('../preview/index.js');
var index$2 = require('../homepage/index.js');
var documentMetadata = require('./document-metadata.js');
var documentManager = require('./document-manager.js');

var services = {
    components,
    'content-types': contentTypes,
    'data-mapper': dataMapper,
    'document-metadata': documentMetadata,
    'document-manager': documentManager,
    'field-sizes': fieldSizes,
    metrics,
    'permission-checker': permissionChecker,
    permission,
    'populate-builder': populateBuilder,
    uid,
    ...index.services ? index.services : {},
    ...index$1.services ? index$1.services : {},
    ...index$2.services
};

module.exports = services;
//# sourceMappingURL=index.js.map
