import { register } from './register.mjs';
import { bootstrap } from './bootstrap.mjs';
import { destroy } from './destroy.mjs';
import { contentTypes } from './content-types/index.mjs';
import { services } from './services/index.mjs';
import { controllers } from './controllers/index.mjs';
import { routes } from './routes/index.mjs';

const getPlugin = ()=>{
    if (strapi.ee.features.isEnabled('cms-content-releases')) {
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
        // Always return register, it handles its own feature check
        register,
        // Always return contentTypes to avoid losing data when the feature is disabled
        contentTypes
    };
};
var index = getPlugin();

export { index as default };
//# sourceMappingURL=index.mjs.map
