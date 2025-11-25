'use strict';

var fp = require('lodash/fp');

const pluginsRegistry = (strapi)=>{
    const plugins = {};
    return {
        get (name) {
            return plugins[name];
        },
        getAll () {
            return plugins;
        },
        add (name, pluginConfig) {
            if (fp.has(name, plugins)) {
                throw new Error(`Plugin ${name} has already been registered.`);
            }
            const pluginModule = strapi.get('modules').add(`plugin::${name}`, pluginConfig);
            plugins[name] = pluginModule;
            return plugins[name];
        }
    };
};

module.exports = pluginsRegistry;
//# sourceMappingURL=plugins.js.map
