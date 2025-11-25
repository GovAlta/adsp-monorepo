import registerAdminPanelRoute from './routes/serve-admin-panel.mjs';
import adminAuthStrategy from './strategies/admin.mjs';
import apiTokenAuthStrategy from './strategies/api-token.mjs';

var register = (({ strapi })=>{
    const passportMiddleware = strapi.service('admin::passport').init();
    strapi.server.api('admin').use(passportMiddleware);
    strapi.get('auth').register('admin', adminAuthStrategy);
    strapi.get('auth').register('content-api', apiTokenAuthStrategy);
    if (strapi.config.get('admin.serveAdminPanel')) {
        registerAdminPanelRoute({
            strapi
        });
    }
});

export { register as default };
//# sourceMappingURL=register.mjs.map
