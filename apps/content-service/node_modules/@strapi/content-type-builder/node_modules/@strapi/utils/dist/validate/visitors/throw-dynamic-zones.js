'use strict';

var contentTypes = require('../../content-types.js');
var utils = require('../utils.js');

const visitor = ({ key, attribute, path })=>{
    if (contentTypes.isDynamicZoneAttribute(attribute)) {
        utils.throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

module.exports = visitor;
//# sourceMappingURL=throw-dynamic-zones.js.map
