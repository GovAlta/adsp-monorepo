var bootstrap = (async ({ strapi })=>{
    const actions = [
        {
            section: 'plugins',
            displayName: 'Read',
            uid: 'read',
            pluginName: 'content-type-builder'
        }
    ];
    await strapi.service('admin::permission').actionProvider.registerMany(actions);
});

export { bootstrap as default };
//# sourceMappingURL=bootstrap.mjs.map
