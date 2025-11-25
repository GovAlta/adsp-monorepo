'use strict';

var strapiUtils = require('@strapi/utils');

var createConditionProvider = ((options = {})=>{
    const provider = strapiUtils.providerFactory(options);
    return {
        ...provider,
        async register (condition) {
            if (strapi.isLoaded) {
                throw new Error(`You can't register new conditions outside the bootstrap function.`);
            }
            return provider.register(condition.name, condition);
        }
    };
});

module.exports = createConditionProvider;
//# sourceMappingURL=condition.js.map
