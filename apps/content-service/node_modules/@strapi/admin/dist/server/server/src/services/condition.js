'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');

const isValidCondition = (condition)=>{
    const { conditionProvider } = index.getService('permission');
    return fp.isString(condition) && conditionProvider.has(condition);
};

exports.isValidCondition = isValidCondition;
//# sourceMappingURL=condition.js.map
