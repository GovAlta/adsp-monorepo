import admin from './admin.mjs';
import createRoutes from './content-api.mjs';

const routes = {
    admin,
    'content-api': createRoutes
};

export { routes };
//# sourceMappingURL=index.mjs.map
