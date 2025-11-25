import register from './register.mjs';
import contentTypes from './content-types/index.mjs';
import bootstrap from './bootstrap.mjs';
import destroy from './destroy.mjs';
import routes from './routes/index.mjs';
import services from './services/index.mjs';
import controllers from './controllers/index.mjs';

const getPlugin = ()=>{
    if (strapi.ee.features.isEnabled('review-workflows')) {
        return {
            register,
            bootstrap,
            destroy,
            contentTypes,
            services,
            controllers,
            routes
        };
    }
    return {
        // Always return contentTypes to avoid losing data when the feature is disabled
        // or downgrading the license
        contentTypes
    };
};
var index = getPlugin();

export { index as default };
//# sourceMappingURL=index.mjs.map
