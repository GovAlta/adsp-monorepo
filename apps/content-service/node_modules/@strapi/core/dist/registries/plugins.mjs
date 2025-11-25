import { has } from 'lodash/fp';

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
            if (has(name, plugins)) {
                throw new Error(`Plugin ${name} has already been registered.`);
            }
            const pluginModule = strapi.get('modules').add(`plugin::${name}`, pluginConfig);
            plugins[name] = pluginModule;
            return plugins[name];
        }
    };
};

export { pluginsRegistry as default };
//# sourceMappingURL=plugins.mjs.map
