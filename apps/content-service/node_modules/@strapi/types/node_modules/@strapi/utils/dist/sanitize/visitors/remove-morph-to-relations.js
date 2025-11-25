'use strict';

var contentTypes = require('../../content-types.js');

const visitor = ({ key, attribute }, { remove })=>{
    if (contentTypes.isMorphToRelationalAttribute(attribute)) {
        remove(key);
    }
};

module.exports = visitor;
//# sourceMappingURL=remove-morph-to-relations.js.map
