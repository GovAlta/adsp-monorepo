'use strict';

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

module.exports = bootstrap;
//# sourceMappingURL=bootstrap.js.map
