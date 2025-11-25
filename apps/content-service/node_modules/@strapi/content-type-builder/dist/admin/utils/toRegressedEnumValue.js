'use strict';

var slugify = require('@sindresorhus/slugify');

const toRegressedEnumValue = (value)=>{
    if (!value) {
        return '';
    }
    return slugify(value, {
        decamelize: false,
        lowercase: false,
        separator: '_'
    });
};

exports.toRegressedEnumValue = toRegressedEnumValue;
//# sourceMappingURL=toRegressedEnumValue.js.map
