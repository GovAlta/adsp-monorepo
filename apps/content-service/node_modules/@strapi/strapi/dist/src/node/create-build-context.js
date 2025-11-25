'use strict';

var os = require('node:os');
var path = require('node:path');
var fs = require('node:fs/promises');
var browserslist = require('browserslist');
var core = require('@strapi/core');
var env = require('./core/env.js');
var plugins = require('./core/plugins.js');
var adminCustomisations = require('./core/admin-customisations.js');

const DEFAULT_BROWSERSLIST = [
    'last 3 major versions',
    'Firefox ESR',
    'last 2 Opera versions',
    'not dead'
];
const createBuildContext = async ({ cwd, logger, tsconfig, strapi, options = {} })=>{
    /**
   * If you make a new strapi instance when one already exists,
   * you will overwrite the global and the app will _most likely_
   * crash and die.
   */ const strapiInstance = strapi ?? core.createStrapi({
        // Directories
        appDir: cwd,
        distDir: tsconfig?.config.options.outDir ?? '',
        // Options
        autoReload: true,
        serveAdminPanel: false
    });
    const serverAbsoluteUrl = strapiInstance.config.get('server.absoluteUrl');
    const adminAbsoluteUrl = strapiInstance.config.get('admin.absoluteUrl');
    const adminPath = strapiInstance.config.get('admin.path');
    // NOTE: Checks that both the server and admin will be served from the same origin (protocol, host, port)
    const sameOrigin = new URL(adminAbsoluteUrl).origin === new URL(serverAbsoluteUrl).origin;
    const adminPublicPath = new URL(adminAbsoluteUrl).pathname;
    const serverPublicPath = new URL(serverAbsoluteUrl).pathname;
    const appDir = strapiInstance.dirs.app.root;
    await env.loadEnv(cwd);
    const env$1 = env.getStrapiAdminEnvVars({
        ADMIN_PATH: adminPublicPath,
        STRAPI_ADMIN_BACKEND_URL: sameOrigin ? serverPublicPath : serverAbsoluteUrl,
        STRAPI_TELEMETRY_DISABLED: String(strapiInstance.telemetry.isDisabled),
        // TODO: Get this url from a utility/consts rather than duplicating it in AIChat constants.ts
        STRAPI_AI_URL: process.env.STRAPI_AI_URL?.replace(/\/+$/, '') ?? 'https://strapi-ai.apps.strapi.io',
        STRAPI_ANALYTICS_URL: process.env.STRAPI_ANALYTICS_URL || 'https://analytics.strapi.io'
    });
    const envKeys = Object.keys(env$1);
    if (envKeys.length > 0) {
        logger.info([
            'Including the following ENV variables as part of the JS bundle:',
            ...envKeys.map((key)=>`    - ${key}`)
        ].join(os.EOL));
    }
    const distPath = path.join(strapiInstance.dirs.dist.root, 'build');
    const distDir = path.relative(cwd, distPath);
    /**
   * If the distPath already exists, clean it
   */ try {
        logger.debug(`Cleaning dist folder: ${distPath}`);
        await fs.rm(distPath, {
            recursive: true,
            force: true
        });
        logger.debug('Cleaned dist folder');
    } catch  {
        // do nothing, it will fail if the folder does not exist
        logger.debug('There was no dist folder to clean');
    }
    const runtimeDir = path.join(cwd, '.strapi', 'client');
    const entry = path.relative(cwd, path.join(runtimeDir, 'app.js'));
    const plugins$1 = await plugins.getEnabledPlugins({
        cwd,
        logger,
        runtimeDir,
        strapi: strapiInstance
    });
    logger.debug('Enabled plugins', os.EOL, plugins$1);
    const pluginsWithFront = plugins.getMapOfPluginsWithAdmin(plugins$1);
    logger.debug('Enabled plugins with FE', os.EOL, pluginsWithFront);
    const target = browserslist.loadConfig({
        path: cwd
    }) ?? DEFAULT_BROWSERSLIST;
    const customisations = await adminCustomisations.loadUserAppFile({
        appDir,
        runtimeDir
    });
    const features = strapiInstance.config.get('features', undefined);
    const { bundler = 'vite', ...restOptions } = options;
    const buildContext = {
        appDir,
        adminPath,
        basePath: adminPublicPath,
        bundler,
        customisations,
        cwd,
        distDir,
        distPath,
        entry,
        env: env$1,
        features,
        logger,
        options: restOptions,
        plugins: pluginsWithFront,
        runtimeDir,
        strapi: strapiInstance,
        target,
        tsconfig
    };
    return buildContext;
};

exports.createBuildContext = createBuildContext;
//# sourceMappingURL=create-build-context.js.map
