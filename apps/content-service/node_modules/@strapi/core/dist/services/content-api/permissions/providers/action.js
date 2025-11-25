'use strict';

var strapiUtils = require('@strapi/utils');

var createActionProvider = ((options = {})=>{
    const provider = strapiUtils.providerFactory(options);
    return {
        ...provider,
        async register (action, payload) {
            if (strapi.isLoaded) {
                throw new Error(`You can't register new actions outside the bootstrap function.`);
            }
            return provider.register(action, payload);
        }
    };
});

module.exports = createActionProvider;
//# sourceMappingURL=action.js.map
