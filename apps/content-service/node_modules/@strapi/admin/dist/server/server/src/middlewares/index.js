'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rateLimit = require('./rateLimit.js');
var dataTransfer = require('./data-transfer.js');

var middlewares = {
    rateLimit,
    'data-transfer': dataTransfer
};

exports.rateLimit = rateLimit;
exports.dataTransfer = dataTransfer;
exports.default = middlewares;
//# sourceMappingURL=index.js.map
