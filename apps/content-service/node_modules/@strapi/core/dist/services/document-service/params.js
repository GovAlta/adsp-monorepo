'use strict';

var fp = require('lodash/fp');

const pickSelectionParams = (data)=>{
    return fp.pick([
        'fields',
        'populate',
        'status'
    ], data);
};

exports.pickSelectionParams = pickSelectionParams;
//# sourceMappingURL=params.js.map
