"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlugins = getPlugins;
exports.getOnlyDefaultPlugins = getOnlyDefaultPlugins;
exports.cleanupPlugins = cleanupPlugins;
const node_path_1 = require("node:path");
const angular_json_1 = require("../../adapter/angular-json");
const nx_json_1 = require("../../config/nx-json");
const file_hasher_1 = require("../../hasher/file-hasher");
const workspace_root_1 = require("../../utils/workspace-root");
const isolation_1 = require("./isolation");
const in_process_loader_1 = require("./in-process-loader");
const transpiler_1 = require("./transpiler");
const enabled_1 = require("./isolation/enabled");
/**
 * Stuff for specified NX Plugins.
 */
let currentPluginsConfigurationHash;
let loadedPlugins;
let pendingPluginsPromise;
let cleanupSpecifiedPlugins;
const loadingMethod = (plugin, root, index) => (0, enabled_1.isIsolationEnabled)()
    ? (0, isolation_1.loadNxPluginInIsolation)(plugin, root, index)
    : (0, in_process_loader_1.loadNxPlugin)(plugin, root);
async function getPlugins(root = workspace_root_1.workspaceRoot) {
    const pluginsConfiguration = (0, nx_json_1.readNxJson)(root).plugins ?? [];
    const pluginsConfigurationHash = (0, file_hasher_1.hashObject)(pluginsConfiguration);
    // If the plugins configuration has not changed, reuse the current plugins
    if (loadedPlugins &&
        pluginsConfigurationHash === currentPluginsConfigurationHash) {
        return loadedPlugins;
    }
    currentPluginsConfigurationHash = pluginsConfigurationHash;
    const [defaultPlugins, specifiedPlugins] = await Promise.all([
        getOnlyDefaultPlugins(root),
        (pendingPluginsPromise ??= loadSpecifiedNxPlugins(pluginsConfiguration, root)),
    ]);
    loadedPlugins = specifiedPlugins.concat(defaultPlugins);
    return loadedPlugins;
}
/**
 * Stuff for default NX Plugins.
 */
let loadedDefaultPlugins;
let loadedDefaultPluginsHash;
let cleanupDefaultPlugins;
let pendingDefaultPluginPromise;
async function getOnlyDefaultPlugins(root = workspace_root_1.workspaceRoot) {
    const hash = root;
    // If the plugins configuration has not changed, reuse the current plugins
    if (loadedDefaultPlugins && hash === loadedDefaultPluginsHash) {
        return loadedDefaultPlugins;
    }
    // Cleanup current plugins before loading new ones
    if (cleanupDefaultPlugins) {
        cleanupDefaultPlugins();
    }
    pendingDefaultPluginPromise ??= loadDefaultNxPlugins(workspace_root_1.workspaceRoot);
    const [result, cleanupFn] = await pendingDefaultPluginPromise;
    cleanupDefaultPlugins = () => {
        loadedDefaultPlugins = undefined;
        pendingDefaultPluginPromise = undefined;
        cleanupFn();
    };
    loadedDefaultPlugins = result;
    loadedDefaultPluginsHash = hash;
    return result;
}
function cleanupPlugins() {
    cleanupSpecifiedPlugins?.();
    cleanupDefaultPlugins?.();
    pendingPluginsPromise = undefined;
    pendingDefaultPluginPromise = undefined;
}
/**
 * Stuff for generic loading
 */
async function loadDefaultNxPlugins(root = workspace_root_1.workspaceRoot) {
    performance.mark('loadDefaultNxPlugins:start');
    const plugins = getDefaultPlugins(root);
    const cleanupFunctions = [];
    const ret = [
        await Promise.all(plugins.map(async (plugin) => {
            performance.mark(`Load Nx Plugin: ${plugin} - start`);
            const [loadedPluginPromise, cleanup] = await loadingMethod(plugin, root);
            cleanupFunctions.push(cleanup);
            const res = await loadedPluginPromise;
            performance.mark(`Load Nx Plugin: ${plugin} - end`);
            performance.measure(`Load Nx Plugin: ${plugin}`, `Load Nx Plugin: ${plugin} - start`, `Load Nx Plugin: ${plugin} - end`);
            return res;
        })),
        () => {
            for (const fn of cleanupFunctions) {
                fn();
            }
            if ((0, transpiler_1.pluginTranspilerIsRegistered)()) {
                (0, transpiler_1.cleanupPluginTSTranspiler)();
            }
        },
    ];
    performance.mark('loadDefaultNxPlugins:end');
    performance.measure('loadDefaultNxPlugins', 'loadDefaultNxPlugins:start', 'loadDefaultNxPlugins:end');
    return ret;
}
async function loadSpecifiedNxPlugins(pluginsConfigurations, root = workspace_root_1.workspaceRoot) {
    // Returning existing plugins is handled by getPlugins,
    // so, if we are here and there are existing plugins, they are stale
    if (cleanupSpecifiedPlugins) {
        cleanupSpecifiedPlugins();
    }
    performance.mark('loadSpecifiedNxPlugins:start');
    pluginsConfigurations ??= [];
    const cleanupFunctions = [];
    const plugins = await Promise.all(pluginsConfigurations.map(async (plugin, index) => {
        const pluginPath = typeof plugin === 'string' ? plugin : plugin.plugin;
        performance.mark(`Load Nx Plugin: ${pluginPath} - start`);
        const [loadedPluginPromise, cleanup] = await loadingMethod(plugin, root, index);
        cleanupFunctions.push(cleanup);
        const res = await loadedPluginPromise;
        res.index = index;
        performance.mark(`Load Nx Plugin: ${pluginPath} - end`);
        performance.measure(`Load Nx Plugin: ${pluginPath}`, `Load Nx Plugin: ${pluginPath} - start`, `Load Nx Plugin: ${pluginPath} - end`);
        return res;
    }));
    performance.mark('loadSpecifiedNxPlugins:end');
    performance.measure('loadSpecifiedNxPlugins', 'loadSpecifiedNxPlugins:start', 'loadSpecifiedNxPlugins:end');
    cleanupSpecifiedPlugins = () => {
        for (const fn of cleanupFunctions) {
            fn();
        }
        if ((0, transpiler_1.pluginTranspilerIsRegistered)()) {
            (0, transpiler_1.cleanupPluginTSTranspiler)();
        }
        pendingPluginsPromise = undefined;
    };
    return plugins;
}
function getDefaultPlugins(root) {
    return [
        (0, node_path_1.join)(__dirname, '../../plugins/js'),
        ...((0, angular_json_1.shouldMergeAngularProjects)(root, false)
            ? [(0, node_path_1.join)(__dirname, '../../adapter/angular-json')]
            : []),
        (0, node_path_1.join)(__dirname, '../../plugins/package-json'),
        (0, node_path_1.join)(__dirname, '../../plugins/project-json/build-nodes/project-json'),
    ];
}
