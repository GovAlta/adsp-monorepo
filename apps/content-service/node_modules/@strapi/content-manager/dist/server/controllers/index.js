'use strict';

var collectionTypes = require('./collection-types.js');
var components = require('./components.js');
var contentTypes = require('./content-types.js');
var init = require('./init.js');
var relations = require('./relations.js');
var singleTypes = require('./single-types.js');
var uid = require('./uid.js');
var index = require('../history/index.js');
var index$1 = require('../preview/index.js');
var index$2 = require('../homepage/index.js');

var controllers = {
    'collection-types': collectionTypes,
    components,
    'content-types': contentTypes,
    init,
    relations,
    'single-types': singleTypes,
    uid,
    ...index.controllers ? index.controllers : {},
    ...index$1.controllers ? index$1.controllers : {},
    ...index$2.controllers
};

module.exports = controllers;
//# sourceMappingURL=index.js.map
