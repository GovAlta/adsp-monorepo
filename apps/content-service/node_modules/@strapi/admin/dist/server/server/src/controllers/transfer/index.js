'use strict';

var fp = require('lodash/fp');
var runner = require('./runner.js');
var token = require('./token.js');

const prefixActionsName = (prefix, dict)=>fp.mapKeys((key)=>`${prefix}-${key}`, dict);
var transfer = {
    ...prefixActionsName('runner', runner.default),
    ...prefixActionsName('token', token)
};

module.exports = transfer;
//# sourceMappingURL=index.js.map
