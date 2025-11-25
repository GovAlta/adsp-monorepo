'use strict';

var contentTypes = require('../../content-types.js');

const visitor = ({ schema, key, attribute }, { remove })=>{
    if (!attribute) {
        return;
    }
    const isPrivate = attribute.private === true || contentTypes.isPrivateAttribute(schema, key);
    if (isPrivate) {
        remove(key);
    }
};

module.exports = visitor;
//# sourceMappingURL=remove-private.js.map
