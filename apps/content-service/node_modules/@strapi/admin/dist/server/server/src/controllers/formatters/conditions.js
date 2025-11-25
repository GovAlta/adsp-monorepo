'use strict';

var fp = require('lodash/fp');

// visible fields for the API
const publicFields = [
    'id',
    'displayName',
    'category'
];
const formatConditions = fp.map(fp.pick(publicFields));

exports.formatConditions = formatConditions;
//# sourceMappingURL=conditions.js.map
