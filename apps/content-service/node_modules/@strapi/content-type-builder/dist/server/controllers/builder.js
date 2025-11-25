'use strict';

var index = require('../utils/index.js');

var builder = {
    getReservedNames (ctx) {
        ctx.body = index.getService('builder').getReservedNames();
    }
};

module.exports = builder;
//# sourceMappingURL=builder.js.map
