import { ProviderInitializationError } from '../errors/providers.mjs';

const assertValidStrapi = (strapi, msg = '')=>{
    if (!strapi) {
        throw new ProviderInitializationError(`${msg}. Strapi instance not found.`);
    }
};

export { assertValidStrapi };
//# sourceMappingURL=providers.mjs.map
