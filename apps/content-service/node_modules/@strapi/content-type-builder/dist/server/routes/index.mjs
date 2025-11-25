import admin from './admin.mjs';
import createRoutes from './content-api.mjs';

var routes = {
    admin,
    'content-api': createRoutes
};

export { routes as default };
//# sourceMappingURL=index.mjs.map
