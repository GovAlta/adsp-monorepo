'use strict';

var providers = require('../errors/providers.js');

const assertValidStrapi = (strapi, msg = '')=>{
    if (!strapi) {
        throw new providers.ProviderInitializationError(`${msg}. Strapi instance not found.`);
    }
};

exports.assertValidStrapi = assertValidStrapi;
//# sourceMappingURL=providers.js.map
