import admin from './admin.mjs';
import createContentApiRoutes from './content-api.mjs';

var routes = {
    admin,
    'content-api': createContentApiRoutes
};

export { routes as default };
//# sourceMappingURL=index.mjs.map
