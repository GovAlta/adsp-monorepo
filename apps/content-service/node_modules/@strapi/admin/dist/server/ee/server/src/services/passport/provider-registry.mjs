import '@strapi/types';

var createProviderRegistry = (()=>{
    const registry = new Map();
    Object.assign(registry, {
        register (provider) {
            if (strapi.isLoaded) {
                throw new Error(`You can't register new provider after the bootstrap`);
            }
            // TODO
            // @ts-expect-error check map types
            this.set(provider.uid, provider);
        },
        registerMany (providers) {
            providers.forEach((provider)=>{
                this.register(provider);
            });
        },
        getAll () {
            // TODO
            // @ts-expect-error check map types
            return Array.from(this.values());
        }
    });
    return registry;
});

export { createProviderRegistry as default };
//# sourceMappingURL=provider-registry.mjs.map
