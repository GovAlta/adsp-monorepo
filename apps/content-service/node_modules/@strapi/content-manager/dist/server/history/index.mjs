import { controllers } from './controllers/index.mjs';
import { services } from './services/index.mjs';
import { routes } from './routes/index.mjs';
import { getService } from './utils.mjs';
import { historyVersion } from './models/history-version.mjs';

/**
 * Check once if the feature is enabled before loading it,
 * so that we can assume it is enabled in the other files.
 */ const getFeature = ()=>{
    if (strapi.ee.features.isEnabled('cms-content-history')) {
        return {
            register ({ strapi: strapi1 }) {
                strapi1.get('models').add(historyVersion);
            },
            bootstrap ({ strapi: strapi1 }) {
                // Start recording history and saving history versions
                getService(strapi1, 'lifecycles').bootstrap();
            },
            destroy ({ strapi: strapi1 }) {
                getService(strapi1, 'lifecycles').destroy();
            },
            controllers,
            services,
            routes
        };
    }
    /**
   * Keep registering the model to avoid losing the data if the feature is disabled,
   * or if the license expires.
   */ return {
        register ({ strapi: strapi1 }) {
            strapi1.get('models').add(historyVersion);
        }
    };
};
var history = getFeature();

export { history as default };
//# sourceMappingURL=index.mjs.map
