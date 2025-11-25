import type { Core } from '@strapi/types';
type PluginMap = Record<string, Core.Plugin>;
declare const pluginsRegistry: (strapi: Core.Strapi) => {
    get(name: string): Core.Plugin;
    getAll(): PluginMap;
    add(name: string, pluginConfig: Core.Plugin): Core.Plugin;
};
export default pluginsRegistry;
//# sourceMappingURL=plugins.d.ts.map