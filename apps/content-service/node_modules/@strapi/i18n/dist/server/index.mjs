import bootstrap from './bootstrap.mjs';
import register from './register.mjs';
import contentTypes from './content-types/index.mjs';
import services from './services/index.mjs';
import routes from './routes/index.mjs';
import controllers from './controllers/index.mjs';

var index = (()=>({
        register,
        bootstrap,
        routes,
        controllers,
        contentTypes,
        services
    }));

export { index as default };
//# sourceMappingURL=index.mjs.map
