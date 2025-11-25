import permissions from '@strapi/permissions';

var createPermissionEngine = (({ providers })=>permissions.engine.new({
        providers
    }));

export { createPermissionEngine as default };
//# sourceMappingURL=engine.mjs.map
