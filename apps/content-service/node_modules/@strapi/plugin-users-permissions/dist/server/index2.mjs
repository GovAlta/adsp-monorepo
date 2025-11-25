import { __require as requireRegister } from './register.mjs';
import { __require as requireBootstrap } from './bootstrap/index.mjs';
import { __require as requireContentTypes } from './content-types/index.mjs';
import { __require as requireMiddlewares } from './middlewares/index.mjs';
import { __require as requireServices } from './services/index.mjs';
import { __require as requireRoutes } from './routes/index.mjs';
import { __require as requireControllers } from './controllers/index.mjs';
import { __require as requireConfig } from './config.mjs';

var server;
var hasRequiredServer;
function requireServer() {
    if (hasRequiredServer) return server;
    hasRequiredServer = 1;
    const register = requireRegister();
    const bootstrap = requireBootstrap();
    const contentTypes = requireContentTypes();
    const middlewares = requireMiddlewares();
    const services = requireServices();
    const routes = requireRoutes();
    const controllers = requireControllers();
    const config = requireConfig();
    server = ()=>({
            register,
            bootstrap,
            config,
            routes,
            controllers,
            contentTypes,
            middlewares,
            services
        });
    return server;
}

export { requireServer as __require };
//# sourceMappingURL=index2.mjs.map
