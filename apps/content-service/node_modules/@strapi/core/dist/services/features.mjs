/**
 * The features service is responsible for managing features within strapi,
 * including interacting with the feature configuration file to know
 * which are enabled and disabled.
 */ const createFeaturesService = (strapi)=>{
    const service = {
        get config () {
            return strapi.config.get('features');
        },
        future: {
            isEnabled (futureFlagName) {
                return service.config?.future?.[futureFlagName] === true;
            }
        }
    };
    return service;
};

export { createFeaturesService };
//# sourceMappingURL=features.mjs.map
