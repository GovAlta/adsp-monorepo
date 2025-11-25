import { routes } from './routes/index.mjs';
import { controllers } from './controllers/index.mjs';
import { services } from './services/index.mjs';
import { getService } from './utils.mjs';

/**
 * Check once if the feature is enabled before loading it,
 * so that we can assume it is enabled in the other files.
 */ const getFeature = ()=>{
    return {
        register () {
            const config = getService(strapi, 'preview-config');
            config.validate();
            config.register();
        },
        bootstrap () {},
        routes,
        controllers,
        services
    };
};
var preview = getFeature();

export { preview as default };
//# sourceMappingURL=index.mjs.map
