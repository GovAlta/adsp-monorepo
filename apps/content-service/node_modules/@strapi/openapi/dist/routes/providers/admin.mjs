import { createDebugger } from '../../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';
import { AbstractRoutesProvider } from './abstract.mjs';

const debug = createDebugger('routes:provider:admin');
class AdminRoutesProvider extends AbstractRoutesProvider {
    get routes() {
        const { admin } = this._strapi;
        const routes = Object.values(admin.routes).flatMap((router)=>router.routes);
        debug('found %o routes in Strapi admin', routes.length);
        return routes;
    }
}

export { AdminRoutesProvider };
//# sourceMappingURL=admin.mjs.map
