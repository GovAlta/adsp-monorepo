'use strict';

var contentTypes = require('../../content-types.js');

const visitor = ({ key, attribute }, { remove })=>{
    if (contentTypes.isDynamicZoneAttribute(attribute)) {
        remove(key);
    }
};

module.exports = visitor;
//# sourceMappingURL=remove-dynamic-zones.js.map
