import { join } from 'path';
import fse from 'fs-extra';
import { defaults, get, getOr, defaultsDeep } from 'lodash/fp';
import * as resolve from 'resolve.exports';
import { env } from '@strapi/utils';
import { loadConfigFile } from '../../utils/load-config-file.mjs';
import { loadFiles } from '../../utils/load-files.mjs';
import { getEnabledPlugins } from './get-enabled-plugins.mjs';
import { getUserPluginsConfig } from './get-user-plugins-config.mjs';
import { getGlobalId } from '../../domain/content-type/index.mjs';

const defaultPlugin = {
    bootstrap () {},
    destroy () {},
    register () {},
    config: {
        default: {},
        validator () {}
    },
    routes: [],
    controllers: {},
    services: {},
    policies: {},
    middlewares: {},
    contentTypes: {}
};
const applyUserExtension = async (plugins)=>{
    const extensionsDir = strapi.dirs.dist.extensions;
    if (!await fse.pathExists(extensionsDir)) {
        return;
    }
    const extendedSchemas = await loadFiles(extensionsDir, '**/content-types/**/schema.json');
    const strapiServers = await loadFiles(extensionsDir, '**/strapi-server.js');
    for (const pluginName of Object.keys(plugins)){
        const plugin = plugins[pluginName];
        // first: load json schema
        for (const ctName of Object.keys(plugin.contentTypes)){
            const extendedSchema = get([
                pluginName,
                'content-types',
                ctName,
                'schema'
            ], extendedSchemas);
            if (extendedSchema) {
                plugin.contentTypes[ctName].schema = {
                    ...plugin.contentTypes[ctName].schema,
                    ...extendedSchema
                };
            }
        }
        // second: execute strapi-server extension
        const strapiServer = get([
            pluginName,
            'strapi-server'
        ], strapiServers);
        if (strapiServer) {
            plugins[pluginName] = await strapiServer(plugin);
        }
    }
};
const applyUserConfig = async (plugins)=>{
    const userPluginsConfig = await getUserPluginsConfig();
    for (const pluginName of Object.keys(plugins)){
        const plugin = plugins[pluginName];
        const userPluginConfig = getOr({}, `${pluginName}.config`, userPluginsConfig);
        const defaultConfig = typeof plugin.config.default === 'function' ? plugin.config.default({
            env
        }) : plugin.config.default;
        const config = defaultsDeep(defaultConfig, userPluginConfig);
        try {
            plugin.config.validator(config);
        } catch (e) {
            if (e instanceof Error) {
                throw new Error(`Error regarding ${pluginName} config: ${e.message}`);
            }
            throw e;
        }
        plugin.config = config;
    }
};
async function loadPlugins(strapi1) {
    const plugins = {};
    const enabledPlugins = await getEnabledPlugins(strapi1);
    strapi1.config.set('enabledPlugins', enabledPlugins);
    for (const pluginName of Object.keys(enabledPlugins)){
        const enabledPlugin = enabledPlugins[pluginName];
        let serverEntrypointPath;
        let resolvedExport = './strapi-server.js';
        try {
            resolvedExport = (resolve.exports(enabledPlugin.packageInfo, 'strapi-server', {
                require: true
            }) ?? './strapi-server.js').toString();
        } catch (e) {
        // no export map or missing strapi-server export => fallback to default
        }
        try {
            serverEntrypointPath = join(enabledPlugin.pathToPlugin, resolvedExport);
        } catch (e) {
            throw new Error(`Error loading the plugin ${pluginName} because ${pluginName} is not installed. Please either install the plugin or remove its configuration.`);
        }
        // only load plugins with a server entrypoint
        if (!await fse.pathExists(serverEntrypointPath)) {
            continue;
        }
        const pluginServer = loadConfigFile(serverEntrypointPath);
        plugins[pluginName] = {
            ...defaultPlugin,
            ...pluginServer,
            contentTypes: formatContentTypes(pluginName, pluginServer.contentTypes ?? {}),
            config: defaults(defaultPlugin.config, pluginServer.config),
            routes: pluginServer.routes ?? defaultPlugin.routes
        };
    }
    // TODO: validate plugin format
    await applyUserConfig(plugins);
    await applyUserExtension(plugins);
    for (const pluginName of Object.keys(plugins)){
        strapi1.get('plugins').add(pluginName, plugins[pluginName]);
    }
}
const formatContentTypes = (pluginName, contentTypes)=>{
    Object.values(contentTypes).forEach((definition)=>{
        const { schema } = definition;
        Object.assign(schema, {
            plugin: pluginName,
            collectionName: schema.collectionName || `${pluginName}_${schema.info.singularName}`.toLowerCase(),
            globalId: getGlobalId(schema, pluginName)
        });
    });
    return contentTypes;
};

export { loadPlugins as default };
//# sourceMappingURL=index.mjs.map
