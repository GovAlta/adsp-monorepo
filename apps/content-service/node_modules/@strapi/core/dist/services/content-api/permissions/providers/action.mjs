import { providerFactory } from '@strapi/utils';

var createActionProvider = ((options = {})=>{
    const provider = providerFactory(options);
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

export { createActionProvider as default };
//# sourceMappingURL=action.mjs.map
