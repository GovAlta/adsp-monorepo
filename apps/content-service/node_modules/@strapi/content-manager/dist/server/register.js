'use strict';

var index = require('./history/index.js');
var index$1 = require('./preview/index.js');

const register = async ({ strapi })=>{
    await index.register?.({
        strapi
    });
    await index$1.register?.({
        strapi
    });
};

module.exports = register;
//# sourceMappingURL=register.js.map
