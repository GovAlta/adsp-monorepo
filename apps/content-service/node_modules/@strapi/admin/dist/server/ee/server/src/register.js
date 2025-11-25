'use strict';

var register$1 = require('../../../server/src/register.js');

var register = (async ({ strapi })=>{
    await register$1({
        strapi
    });
});

module.exports = register;
//# sourceMappingURL=register.js.map
