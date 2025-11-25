import type { BaseContext } from '../types';
interface LocalPluginMeta {
    name: string;
    /**
     * camelCased version of the plugin name
     */
    importName: string;
    /**
     * The path to the plugin, relative to the app's root directory
     * in system format
     */
    path: string;
    /**
     * The path to the plugin, relative to the runtime directory
     * in module format (i.e. with forward slashes) because thats
     * where it should be used as an import
     */
    modulePath: string;
    type: 'local';
}
interface ModulePluginMeta {
    name: string;
    /**
     * camelCased version of the plugin name
     */
    importName: string;
    /**
     * Modules don't have a path because we never resolve them to their node_modules
     * because we simply do not require it.
     */
    path?: never;
    /**
     * The path to the plugin, relative to the app's root directory
     * in module format (i.e. with forward slashes)
     */
    modulePath: string;
    type: 'module';
}
type PluginMeta = LocalPluginMeta | ModulePluginMeta;
declare const getEnabledPlugins: ({ cwd, logger, runtimeDir, strapi, }: Pick<BaseContext, 'cwd' | 'logger' | 'strapi' | 'runtimeDir'>) => Promise<Record<string, PluginMeta>>;
declare const getMapOfPluginsWithAdmin: (plugins: Record<string, PluginMeta>) => ({
    modulePath: string;
    name: string;
    /**
     * camelCased version of the plugin name
     */
    importName: string;
    /**
     * The path to the plugin, relative to the app's root directory
     * in system format
     */
    path: string;
    type: 'local';
} | {
    modulePath: string;
    name: string;
    /**
     * camelCased version of the plugin name
     */
    importName: string;
    /**
     * Modules don't have a path because we never resolve them to their node_modules
     * because we simply do not require it.
     */
    path?: undefined;
    type: 'module';
})[];
export { getEnabledPlugins, getMapOfPluginsWithAdmin };
export type { PluginMeta, LocalPluginMeta, ModulePluginMeta };
//# sourceMappingURL=plugins.d.ts.map