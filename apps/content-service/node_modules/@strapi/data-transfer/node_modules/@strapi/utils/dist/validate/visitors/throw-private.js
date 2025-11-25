'use strict';

var contentTypes = require('../../content-types.js');
var utils = require('../utils.js');

const visitor = ({ schema, key, attribute, path })=>{
    if (!attribute) {
        return;
    }
    const isPrivate = attribute.private === true || contentTypes.isPrivateAttribute(schema, key);
    if (isPrivate) {
        utils.throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

module.exports = visitor;
//# sourceMappingURL=throw-private.js.map
