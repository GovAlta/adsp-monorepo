import { bootstrap } from './bootstrap.mjs';
import { services } from './services/index.mjs';
import { routes } from './routes/index.mjs';
import { controllers } from './controllers/index.mjs';
import { config } from './config.mjs';
import middlewares from './middlewares/index.mjs';

var index = {
    bootstrap,
    services,
    routes,
    controllers,
    config,
    middlewares
};

export { index as default };
//# sourceMappingURL=index.mjs.map
