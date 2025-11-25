'use strict';

var index = require('./history/index.js');

const destroy = async ({ strapi })=>{
    await index.destroy?.({
        strapi
    });
};

module.exports = destroy;
//# sourceMappingURL=destroy.js.map
