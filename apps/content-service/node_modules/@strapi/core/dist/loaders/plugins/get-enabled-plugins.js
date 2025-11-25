'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var getUserPluginsConfig = require('./get-user-plugins-config.js');

/**
 * otherwise known as "core features"
 *
 * NOTE: These are excluded from the content manager plugin list, as they are always enabled.
 *       See admin.ts server controller on the content-manager plugin for more details.
 */ const INTERNAL_PLUGINS = [
    '@strapi/content-manager',
    '@strapi/content-type-builder',
    '@strapi/email',
    '@strapi/upload',
    '@strapi/i18n',
    '@strapi/content-releases',
    '@strapi/review-workflows'
];
const isStrapiPlugin = (info)=>fp.get('strapi.kind', info) === 'plugin';
const validatePluginName = (pluginName)=>{
    if (!strapiUtils.strings.isKebabCase(pluginName)) {
        throw new Error(`Plugin name "${pluginName}" is not in kebab (an-example-of-kebab-case)`);
    }
};
const toDetailedDeclaration = (declaration)=>{
    if (typeof declaration === 'boolean') {
        return {
            enabled: declaration
        };
    }
    const detailedDeclaration = {
        enabled: declaration.enabled
    };
    if (declaration?.resolve) {
        let pathToPlugin = '';
        if (declaration.isModule) {
            /**
       * we only want the node_module here, not the package.json
       */ pathToPlugin = path.join(declaration.resolve, '..');
        } else {
            try {
                pathToPlugin = path.dirname(require.resolve(declaration.resolve));
            } catch (e) {
                pathToPlugin = path.resolve(strapi.dirs.app.root, declaration.resolve);
                if (!fs.existsSync(pathToPlugin) || !fs.statSync(pathToPlugin).isDirectory()) {
                    throw new Error(`${declaration.resolve} couldn't be resolved`);
                }
            }
        }
        detailedDeclaration.pathToPlugin = pathToPlugin;
    }
    return detailedDeclaration;
};
const getEnabledPlugins = async (strapi1, { client } = {
    client: false
})=>{
    const internalPlugins = {};
    for (const dep of INTERNAL_PLUGINS){
        const packagePath = path.join(dep, 'package.json');
        // NOTE: internal plugins should be resolved from the strapi package
        const packageModulePath = require.resolve(packagePath, {
            paths: [
                require.resolve('@strapi/strapi/package.json'),
                process.cwd()
            ]
        });
        const packageInfo = require(packageModulePath);
        validatePluginName(packageInfo.strapi.name);
        internalPlugins[packageInfo.strapi.name] = {
            ...toDetailedDeclaration({
                enabled: true,
                resolve: packageModulePath,
                isModule: client
            }),
            info: packageInfo.strapi,
            packageInfo
        };
    }
    const installedPlugins = {};
    const dependencies = strapi1.config.get('info.dependencies', {});
    for (const dep of Object.keys(dependencies)){
        const packagePath = path.join(dep, 'package.json');
        let packageInfo;
        try {
            packageInfo = require(packagePath);
        } catch  {
            continue;
        }
        if (isStrapiPlugin(packageInfo)) {
            validatePluginName(packageInfo.strapi.name);
            installedPlugins[packageInfo.strapi.name] = {
                ...toDetailedDeclaration({
                    enabled: true,
                    resolve: packagePath,
                    isModule: client
                }),
                info: {
                    ...packageInfo.strapi,
                    packageName: packageInfo.name
                },
                packageInfo
            };
        }
    }
    const declaredPlugins = {};
    const userPluginsConfig = await getUserPluginsConfig.getUserPluginsConfig();
    _.forEach(userPluginsConfig, (declaration, pluginName)=>{
        validatePluginName(pluginName);
        declaredPlugins[pluginName] = {
            ...toDetailedDeclaration(declaration),
            info: {}
        };
        const { pathToPlugin } = declaredPlugins[pluginName];
        // for manually resolved plugins
        if (pathToPlugin) {
            const packagePath = path.join(pathToPlugin, 'package.json');
            const packageInfo = require(packagePath);
            if (isStrapiPlugin(packageInfo)) {
                declaredPlugins[pluginName].info = packageInfo.strapi || {};
                declaredPlugins[pluginName].packageInfo = packageInfo;
            }
        }
    });
    const declaredPluginsResolves = fp.map(fp.prop('pathToPlugin'), declaredPlugins);
    const installedPluginsNotAlreadyUsed = fp.pickBy((p)=>!declaredPluginsResolves.includes(p.pathToPlugin), installedPlugins);
    const enabledPlugins = fp.pipe(fp.defaultsDeep(declaredPlugins), fp.defaultsDeep(installedPluginsNotAlreadyUsed), fp.pickBy((p)=>p.enabled))(internalPlugins);
    return enabledPlugins;
};

exports.getEnabledPlugins = getEnabledPlugins;
//# sourceMappingURL=get-enabled-plugins.js.map
